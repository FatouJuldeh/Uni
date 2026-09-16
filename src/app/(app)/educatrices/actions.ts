"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { isValidISODate, isValidTime, timeToMinutes } from "@/lib/dates";
import { LEAVE_TYPES } from "@/lib/labels";
import { bool, isoDate, optional, str, zodToState, type ActionState } from "@/lib/forms";

const educatorSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis").max(80),
  lastName: z.string().min(1, "Le nom est requis").max(80),
  email: z.string().email("Courriel invalide").nullable(),
  phone: z.string().max(40).nullable(),
  position: z.string().min(1, "Le poste est requis").max(80),
  hireDate: isoDate.nullable(),
  qualifications: z.string().max(1000).nullable(),
  notes: z.string().max(2000).nullable(),
  active: z.boolean(),
});

function parseEducator(formData: FormData) {
  return educatorSchema.safeParse({
    firstName: str(formData, "firstName"),
    lastName: str(formData, "lastName"),
    email: optional(formData, "email")?.toLowerCase() ?? null,
    phone: optional(formData, "phone"),
    position: str(formData, "position") || "Éducatrice",
    hireDate: optional(formData, "hireDate"),
    qualifications: optional(formData, "qualifications"),
    notes: optional(formData, "notes"),
    active: formData.has("active") ? bool(formData, "active") : true,
  });
}

/** Lit les horaires hebdomadaires du formulaire (shift-<jour>-start / shift-<jour>-end). */
function parseShifts(formData: FormData): { weekday: number; startTime: string; endTime: string }[] | string {
  const shifts = [];
  for (let day = 1; day <= 7; day++) {
    const start = str(formData, `shift-${day}-start`);
    const end = str(formData, `shift-${day}-end`);
    if (!start && !end) continue;
    if (!isValidTime(start) || !isValidTime(end)) return "Horaire invalide (format HH:MM).";
    if (timeToMinutes(end) <= timeToMinutes(start)) return "L'heure de fin doit être après l'heure de début.";
    shifts.push({ weekday: day, startTime: start, endTime: end });
  }
  return shifts;
}

export async function createEducator(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("ADMIN");
  const parsed = parseEducator(formData);
  if (!parsed.success) return zodToState(parsed.error);
  const shifts = parseShifts(formData);
  if (typeof shifts === "string") return { error: shifts };
  const educator = await prisma.educator.create({
    data: { ...parsed.data, shifts: { create: shifts } },
  });
  revalidatePath("/educatrices");
  redirect(`/educatrices/${educator.id}`);
}

export async function updateEducator(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("ADMIN");
  const parsed = parseEducator(formData);
  if (!parsed.success) return zodToState(parsed.error);
  const shifts = parseShifts(formData);
  if (typeof shifts === "string") return { error: shifts };
  await prisma.$transaction([
    prisma.workShift.deleteMany({ where: { educatorId: id } }),
    prisma.educator.update({ where: { id }, data: { ...parsed.data, shifts: { create: shifts } } }),
  ]);
  revalidatePath("/educatrices");
  revalidatePath(`/educatrices/${id}`);
  redirect(`/educatrices/${id}`);
}

export async function deleteEducator(formData: FormData) {
  await requireRole("ADMIN");
  const id = str(formData, "id");
  await prisma.educator.delete({ where: { id } });
  revalidatePath("/educatrices");
  redirect("/educatrices");
}

const leaveSchema = z
  .object({
    educatorId: z.string().min(1),
    startDate: isoDate,
    endDate: isoDate,
    type: z.enum(Object.keys(LEAVE_TYPES) as [string, ...string[]]),
    note: z.string().max(500).nullable(),
  })
  .refine((v) => v.endDate >= v.startDate, { message: "La date de fin doit être après la date de début.", path: ["endDate"] });

export async function addLeave(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("ADMIN");
  const parsed = leaveSchema.safeParse({
    educatorId: str(formData, "educatorId"),
    startDate: str(formData, "startDate"),
    endDate: str(formData, "endDate") || str(formData, "startDate"),
    type: str(formData, "type") || "CONGE",
    note: optional(formData, "note"),
  });
  if (!parsed.success) return zodToState(parsed.error);
  await prisma.leave.create({ data: parsed.data });
  revalidatePath(`/educatrices/${parsed.data.educatorId}`);
  revalidatePath("/");
  return { success: "Congé enregistré." };
}

export async function deleteLeave(formData: FormData) {
  await requireRole("ADMIN");
  const id = str(formData, "id");
  const leave = await prisma.leave.delete({ where: { id } });
  revalidatePath(`/educatrices/${leave.educatorId}`);
  revalidatePath("/");
}

/** Pointage quotidien des éducatrices (status-<id>, arrival-<id>, departure-<id>, note-<id>). */
export async function saveEducatorAttendance(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("ADMIN", "EDUCATRICE");
  const date = str(formData, "date");
  if (!isValidISODate(date)) return { error: "Date invalide." };
  const educators = await prisma.educator.findMany({ where: { active: true }, select: { id: true } });
  const ops = [];
  for (const { id } of educators) {
    const status = str(formData, `status-${id}`);
    if (!status) {
      ops.push(prisma.educatorAttendance.deleteMany({ where: { educatorId: id, date } }));
      continue;
    }
    if (!["PRESENT", "ABSENT", "RETARD"].includes(status)) return { error: "Statut invalide." };
    const arrival = str(formData, `arrival-${id}`);
    const departure = str(formData, `departure-${id}`);
    if (arrival && !isValidTime(arrival)) return { error: "Heure d'arrivée invalide." };
    if (departure && !isValidTime(departure)) return { error: "Heure de départ invalide." };
    const data = {
      status,
      arrivalTime: status !== "ABSENT" && arrival ? arrival : null,
      departureTime: status !== "ABSENT" && departure ? departure : null,
      note: str(formData, `note-${id}`) || null,
    };
    ops.push(
      prisma.educatorAttendance.upsert({
        where: { educatorId_date: { educatorId: id, date } },
        create: { educatorId: id, date, ...data },
        update: data,
      }),
    );
  }
  await prisma.$transaction(ops);
  revalidatePath("/educatrices/pointage");
  return { success: `Pointage du ${date} enregistré.` };
}

export async function goToPointageDate(formData: FormData) {
  const date = str(formData, "date");
  redirect(`/educatrices/pointage${isValidISODate(date) ? `?date=${date}` : ""}`);
}
