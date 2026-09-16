import { z } from "zod";

/** Résultat standard renvoyé par les Server Actions de formulaire. */
export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  success?: string;
} | undefined;

export function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

export function optional(formData: FormData, key: string): string | null {
  const v = str(formData, key);
  return v === "" ? null : v;
}

export function bool(formData: FormData, key: string): boolean {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

export function intOrNull(formData: FormData, key: string): number | null {
  const v = str(formData, key);
  if (v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

export function zodToState(err: z.ZodError): ActionState {
  const flat = err.flatten();
  const first =
    (Object.values(flat.fieldErrors) as (string[] | undefined)[]).flat().find(Boolean) ?? flat.formErrors[0];
  return {
    error: first ?? "Formulaire invalide.",
    fieldErrors: flat.fieldErrors as Record<string, string[] | undefined>,
  };
}

export const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide (AAAA-MM-JJ)");
export const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Heure invalide (HH:MM)");
