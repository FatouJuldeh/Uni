"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { isValidISODate, isValidTime } from "@/lib/dates";
import { ATTENDANCE_STATUSES, type AttendanceStatus } from "@/lib/labels";
import { str, type ActionState } from "@/lib/forms";

/**
 * Enregistre la feuille de présence d'un groupe pour une date.
 * Champs attendus : date, groupId, puis pour chaque enfant :
 *   status-<childId>, arrival-<childId>, departure-<childId>, note-<childId>
 */
export async function saveAttendanceSheet(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireRole("ADMIN", "EDUCATRICE");
  const date = str(formData, "date");
  const groupId = str(formData, "groupId");
  if (!isValidISODate(date)) return { error: "Date invalide." };

  const children = await prisma.child.findMany({
    where: { active: true, ...(groupId ? { groupId } : {}) },
    select: { id: true },
  });

  const ops = [];
  for (const { id } of children) {
    const status = str(formData, `status-${id}`);
    if (!status) {
      ops.push(prisma.attendance.deleteMany({ where: { childId: id, date } }));
      continue;
    }
    if (!ATTENDANCE_STATUSES.includes(status as AttendanceStatus)) {
      return { error: "Statut de présence invalide." };
    }
    const arrival = str(formData, `arrival-${id}`);
    const departure = str(formData, `departure-${id}`);
    if (arrival && !isValidTime(arrival)) return { error: "Heure d'arrivée invalide (HH:MM)." };
    if (departure && !isValidTime(departure)) return { error: "Heure de départ invalide (HH:MM)." };
    const isPresent = status === "PRESENT" || status === "RETARD";
    const data = {
      status,
      arrivalTime: isPresent && arrival ? arrival : null,
      departureTime: isPresent && departure ? departure : null,
      note: str(formData, `note-${id}`) || null,
      recordedBy: user.name,
    };
    ops.push(
      prisma.attendance.upsert({
        where: { childId_date: { childId: id, date } },
        create: { childId: id, date, ...data },
        update: data,
      }),
    );
  }
  await prisma.$transaction(ops);
  revalidatePath("/presences");
  revalidatePath("/");
  return { success: `Feuille du ${date} enregistrée (${children.length} enfant${children.length > 1 ? "s" : ""}).` };
}

export async function goToDate(formData: FormData) {
  const date = str(formData, "date");
  const groupId = str(formData, "groupId");
  const params = new URLSearchParams();
  if (isValidISODate(date)) params.set("date", date);
  if (groupId) params.set("groupe", groupId);
  redirect(`/presences?${params.toString()}`);
}
