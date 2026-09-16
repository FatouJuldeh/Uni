"use client";

import { useFormAction } from "@/lib/use-form-action";
import { useEffect, useRef } from "react";
import { GUARDIAN_RELATIONS } from "@/lib/labels";
import { Alert, Field } from "@/components/ui";
import { addGuardian } from "./actions";

export function GuardianForm({ childId }: { childId: string }) {
  const { state, pending, onSubmit } = useFormAction(addGuardian);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.success) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} onSubmit={onSubmit} className="space-y-3">
      <input type="hidden" name="childId" value={childId} />
      {state?.error ? <Alert>{state.error}</Alert> : null}
      {state?.success ? <Alert kind="success">{state.success}</Alert> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nom" htmlFor="g-name">
          <input id="g-name" name="name" required className="input" />
        </Field>
        <Field label="Lien" htmlFor="g-relation">
          <select id="g-relation" name="relation" className="input">
            {GUARDIAN_RELATIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </Field>
        <Field label="Téléphone" htmlFor="g-phone">
          <input id="g-phone" name="phone" type="tel" className="input" />
        </Field>
        <Field label="Courriel" htmlFor="g-email">
          <input id="g-email" name="email" type="email" className="input" />
        </Field>
      </div>
      <div className="flex flex-wrap gap-4 text-sm text-slate-700">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="isPrimary" className="h-4 w-4 accent-teal-600" /> Contact principal
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="canPickUp" defaultChecked className="h-4 w-4 accent-teal-600" /> Autorisé à venir chercher l&apos;enfant
        </label>
      </div>
      <button type="submit" className="btn-secondary" disabled={pending}>
        {pending ? "Ajout…" : "Ajouter le contact"}
      </button>
    </form>
  );
}
