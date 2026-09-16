"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createSession, destroySession, verifyPassword } from "@/lib/auth";
import type { ActionState } from "@/lib/forms";

const schema = z.object({
  email: z.string().email("Adresse courriel invalide"),
  password: z.string().min(1, "Mot de passe requis"),
  next: z.string().optional(),
});

export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = schema.safeParse({
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
    next: String(formData.get("next") ?? ""),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !user.active || !(await verifyPassword(parsed.data.password, user.password))) {
    return { error: "Courriel ou mot de passe incorrect." };
  }

  await createSession(user.id);
  const next = parsed.data.next && parsed.data.next.startsWith("/") ? parsed.data.next : "/";
  redirect(next);
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
