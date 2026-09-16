"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole, requireUser } from "@/lib/auth";
import { bool, isoDate, optional, str, zodToState, type ActionState } from "@/lib/forms";

const childSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis").max(80),
  lastName: z.string().min(1, "Le nom est requis").max(80),
  birthDate: isoDate,
  gender: z.enum(["F", "M", "AUTRE"]).nullable(),
  groupId: z.string().nullable(),
  allergies: z.string().max(500).nullable(),
  medicalNotes: z.string().max(2000).nullable(),
  notes: z.string().max(2000).nullable(),
  startDate: isoDate.nullable(),
  active: z.boolean(),
});

function parseChild(formData: FormData) {
  const gender = optional(formData, "gender");
  return childSchema.safeParse({
    firstName: str(formData, "firstName"),
    lastName: str(formData, "lastName"),
    birthDate: str(formData, "birthDate"),
    gender: gender as "F" | "M" | "AUTRE" | null,
    groupId: optional(formData, "groupId"),
    allergies: optional(formData, "allergies"),
    medicalNotes: optional(formData, "medicalNotes"),
    notes: optional(formData, "notes"),
    startDate: optional(formData, "startDate"),
    active: formData.has("active") ? bool(formData, "active") : true,
  });
}

export async function createChild(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("ADMIN", "EDUCATRICE");
  const parsed = parseChild(formData);
  if (!parsed.success) return zodToState(parsed.error);

  const guardianName = optional(formData, "guardianName");
  const child = await prisma.child.create({
    data: {
      ...parsed.data,
      guardians: guardianName
        ? {
            create: {
              name: guardianName,
              relation: str(formData, "guardianRelation") || "Parent",
              phone: optional(formData, "guardianPhone"),
              email: optional(formData, "guardianEmail"),
              isPrimary: true,
            },
          }
        : undefined,
    },
  });
  revalidatePath("/enfants");
  redirect(`/enfants/${child.id}`);
}

export async function updateChild(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("ADMIN", "EDUCATRICE");
  const parsed = parseChild(formData);
  if (!parsed.success) return zodToState(parsed.error);
  await prisma.child.update({ where: { id }, data: parsed.data });
  revalidatePath("/enfants");
  revalidatePath(`/enfants/${id}`);
  redirect(`/enfants/${id}`);
}

export async function deleteChild(formData: FormData) {
  await requireRole("ADMIN");
  const id = str(formData, "id");
  await prisma.child.delete({ where: { id } });
  revalidatePath("/enfants");
  redirect("/enfants");
}

const guardianSchema = z.object({
  childId: z.string().min(1),
  name: z.string().min(1, "Le nom est requis").max(120),
  relation: z.string().min(1, "Le lien est requis").max(60),
  phone: z.string().max(40).nullable(),
  email: z.string().email("Courriel invalide").nullable(),
  isPrimary: z.boolean(),
  canPickUp: z.boolean(),
});

export async function addGuardian(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const parsed = guardianSchema.safeParse({
    childId: str(formData, "childId"),
    name: str(formData, "name"),
    relation: str(formData, "relation"),
    phone: optional(formData, "phone"),
    email: optional(formData, "email"),
    isPrimary: bool(formData, "isPrimary"),
    canPickUp: bool(formData, "canPickUp"),
  });
  if (!parsed.success) return zodToState(parsed.error);
  const { childId, ...data } = parsed.data;
  if (data.isPrimary) {
    await prisma.guardian.updateMany({ where: { childId }, data: { isPrimary: false } });
  }
  await prisma.guardian.create({ data: { ...data, childId } });
  revalidatePath(`/enfants/${childId}`);
  return { success: "Contact ajouté." };
}

export async function deleteGuardian(formData: FormData) {
  await requireUser();
  const id = str(formData, "id");
  const g = await prisma.guardian.delete({ where: { id } });
  revalidatePath(`/enfants/${g.childId}`);
}
