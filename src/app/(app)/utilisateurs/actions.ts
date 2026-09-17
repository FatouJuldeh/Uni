"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword, requireRole } from "@/lib/auth";
import { bool, optional, str, zodToState, type ActionState } from "@/lib/forms";

const roleEnum = z.enum(["ADMIN", "EDUCATRICE", "PARENT"]);

const createSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(120),
  email: z.string().email("Courriel invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  role: roleEnum,
  educatorId: z.string().nullable(),
});

export async function createUser(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("ADMIN");
  const parsed = createSchema.safeParse({
    name: str(formData, "name"),
    email: str(formData, "email").toLowerCase(),
    password: String(formData.get("password") ?? ""),
    role: str(formData, "role") || "EDUCATRICE",
    educatorId: optional(formData, "educatorId"),
  });
  if (!parsed.success) return zodToState(parsed.error);
  const { password, ...data } = parsed.data;
  if (await prisma.user.findUnique({ where: { email: data.email } })) {
    return { error: "Un compte existe déjà avec ce courriel." };
  }
  if (data.educatorId && (await prisma.user.findUnique({ where: { educatorId: data.educatorId } }))) {
    return { error: "Cette éducatrice est déjà liée à un compte." };
  }
  await prisma.user.create({ data: { ...data, password: await hashPassword(password) } });
  revalidatePath("/utilisateurs");
  redirect("/utilisateurs");
}

const updateSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(120),
  email: z.string().email("Courriel invalide"),
  role: roleEnum,
  educatorId: z.string().nullable(),
  active: z.boolean(),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères").nullable(),
});

export async function updateUser(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await requireRole("ADMIN");
  const parsed = updateSchema.safeParse({
    name: str(formData, "name"),
    email: str(formData, "email").toLowerCase(),
    role: str(formData, "role"),
    educatorId: optional(formData, "educatorId"),
    active: bool(formData, "active"),
    password: optional(formData, "password"),
  });
  if (!parsed.success) return zodToState(parsed.error);
  const { password, ...data } = parsed.data;

  if (id === me.id && (data.role !== "ADMIN" || !data.active)) {
    return { error: "Vous ne pouvez pas retirer vos propres droits d'administration ni désactiver votre compte." };
  }
  const emailTaken = await prisma.user.findFirst({ where: { email: data.email, NOT: { id } } });
  if (emailTaken) return { error: "Un autre compte utilise déjà ce courriel." };
  if (data.educatorId) {
    const linked = await prisma.user.findFirst({ where: { educatorId: data.educatorId, NOT: { id } } });
    if (linked) return { error: "Cette éducatrice est déjà liée à un autre compte." };
  }
  await prisma.user.update({
    where: { id },
    data: { ...data, ...(password ? { password: await hashPassword(password) } : {}) },
  });
  if (password || !data.active) {
    await prisma.session.deleteMany({ where: { userId: id, ...(id === me.id ? { NOT: { id: "" } } : {}) } });
  }
  revalidatePath("/utilisateurs");
  redirect("/utilisateurs");
}

export async function deleteUser(formData: FormData) {
  const me = await requireRole("ADMIN");
  const id = str(formData, "id");
  if (id === me.id) redirect("/utilisateurs?erreur=soi-meme");
  await prisma.user.delete({ where: { id } });
  revalidatePath("/utilisateurs");
  redirect("/utilisateurs");
}
