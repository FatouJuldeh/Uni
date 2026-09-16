"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { timeToMinutes } from "@/lib/dates";
import { SLOT_CATEGORIES } from "@/lib/labels";
import { hhmm, optional, str, zodToState, type ActionState } from "@/lib/forms";

const slotSchema = z
  .object({
    groupId: z.string().min(1, "Le groupe est requis"),
    weekdays: z.array(z.number().int().min(1).max(7)).min(1, "Choisissez au moins un jour"),
    startTime: hhmm,
    endTime: hhmm,
    title: z.string().min(1, "Le titre est requis").max(120),
    description: z.string().max(1000).nullable(),
    location: z.string().max(120).nullable(),
    category: z.enum(Object.keys(SLOT_CATEGORIES) as [string, ...string[]]),
    educatorId: z.string().nullable(),
  })
  .refine((v) => timeToMinutes(v.endTime) > timeToMinutes(v.startTime), {
    message: "L'heure de fin doit être après l'heure de début.",
    path: ["endTime"],
  });

function parseSlot(formData: FormData) {
  return slotSchema.safeParse({
    groupId: str(formData, "groupId"),
    weekdays: formData.getAll("weekdays").map(Number),
    startTime: str(formData, "startTime"),
    endTime: str(formData, "endTime"),
    title: str(formData, "title"),
    description: optional(formData, "description"),
    location: optional(formData, "location"),
    category: str(formData, "category") || "ACTIVITE",
    educatorId: optional(formData, "educatorId"),
  });
}

export async function createSlot(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("ADMIN", "EDUCATRICE");
  const parsed = parseSlot(formData);
  if (!parsed.success) return zodToState(parsed.error);
  const { weekdays, ...data } = parsed.data;
  await prisma.scheduleSlot.createMany({ data: weekdays.map((weekday) => ({ ...data, weekday })) });
  revalidatePath("/emploi-du-temps");
  revalidatePath("/");
  return { success: `Créneau « ${data.title} » ajouté (${weekdays.length} jour${weekdays.length > 1 ? "s" : ""}).` };
}

export async function updateSlot(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("ADMIN", "EDUCATRICE");
  const parsed = parseSlot(formData);
  if (!parsed.success) return zodToState(parsed.error);
  const { weekdays, ...data } = parsed.data;
  await prisma.scheduleSlot.update({ where: { id }, data: { ...data, weekday: weekdays[0] } });
  revalidatePath("/emploi-du-temps");
  revalidatePath("/");
  redirect(`/emploi-du-temps?groupe=${data.groupId}`);
}

export async function deleteSlot(formData: FormData) {
  await requireRole("ADMIN", "EDUCATRICE");
  const id = str(formData, "id");
  const slot = await prisma.scheduleSlot.delete({ where: { id } });
  revalidatePath("/emploi-du-temps");
  revalidatePath("/");
  redirect(`/emploi-du-temps?groupe=${slot.groupId}`);
}

/** Copie tous les créneaux d'un groupe vers un autre groupe. */
export async function copySchedule(formData: FormData) {
  await requireRole("ADMIN");
  const from = str(formData, "fromGroupId");
  const to = str(formData, "toGroupId");
  if (!from || !to || from === to) redirect(`/emploi-du-temps?groupe=${to || from}`);
  const slots = await prisma.scheduleSlot.findMany({ where: { groupId: from } });
  await prisma.scheduleSlot.createMany({
    data: slots.map((s) => ({
      groupId: to,
      weekday: s.weekday,
      startTime: s.startTime,
      endTime: s.endTime,
      title: s.title,
      description: s.description,
      location: s.location,
      category: s.category,
      educatorId: s.educatorId,
    })),
  });
  revalidatePath("/emploi-du-temps");
  redirect(`/emploi-du-temps?groupe=${to}`);
}
