"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { intOrNull, optional, str, zodToState, type ActionState } from "@/lib/forms";

const schema = z.object({
  name: z.string().min(1, "Le nom est requis").max(80),
  ageMin: z.number().int().min(0).nullable(),
  ageMax: z.number().int().min(0).nullable(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Couleur invalide"),
  room: z.string().max(80).nullable(),
  capacity: z.number().int().min(0).nullable(),
  educatorIds: z.array(z.string()),
  leadId: z.string().nullable(),
});

function parse(formData: FormData) {
  return schema.safeParse({
    name: str(formData, "name"),
    ageMin: intOrNull(formData, "ageMin"),
    ageMax: intOrNull(formData, "ageMax"),
    color: str(formData, "color") || "#0d9488",
    room: optional(formData, "room"),
    capacity: intOrNull(formData, "capacity"),
    educatorIds: formData.getAll("educatorIds").map(String),
    leadId: optional(formData, "leadId"),
  });
}

export async function createGroup(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("ADMIN");
  const parsed = parse(formData);
  if (!parsed.success) return zodToState(parsed.error);
  const { educatorIds, leadId, ...data } = parsed.data;
  const group = await prisma.group.create({
    data: {
      ...data,
      educators: {
        create: educatorIds.map((educatorId) => ({ educatorId, isLead: educatorId === leadId })),
      },
    },
  });
  revalidatePath("/groupes");
  redirect(`/groupes/${group.id}`);
}

export async function updateGroup(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("ADMIN");
  const parsed = parse(formData);
  if (!parsed.success) return zodToState(parsed.error);
  const { educatorIds, leadId, ...data } = parsed.data;
  await prisma.$transaction([
    prisma.groupEducator.deleteMany({ where: { groupId: id } }),
    prisma.group.update({
      where: { id },
      data: {
        ...data,
        educators: {
          create: educatorIds.map((educatorId) => ({ educatorId, isLead: educatorId === leadId })),
        },
      },
    }),
  ]);
  revalidatePath("/groupes");
  redirect(`/groupes/${id}`);
}

export async function deleteGroup(formData: FormData) {
  await requireRole("ADMIN");
  const id = str(formData, "id");
  await prisma.group.delete({ where: { id } });
  revalidatePath("/groupes");
  redirect("/groupes");
}
