"use client";

import { useFormAction } from "@/lib/use-form-action";
import { useEffect, useRef } from "react";
import Link from "next/link";
import type { ActionState } from "@/lib/forms";
import { SLOT_CATEGORIES } from "@/lib/labels";
import { WEEKDAYS } from "@/lib/dates";
import { Alert, Field } from "@/components/ui";

export function SlotForm({
  action,
  groupId,
  groups,
  educators,
  initial,
  cancelHref,
  mode = "create",
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  groupId: string;
  groups: { id: string; name: string }[];
  educators: { id: string; firstName: string; lastName: string }[];
  initial?: {
    weekday: number;
    startTime: string;
    endTime: string;
    title: string;
    description: string | null;
    location: string | null;
    category: string;
    educatorId: string | null;
  };
  cancelHref?: string;
  mode?: "create" | "edit";
}) {
  const { state, pending, onSubmit } = useFormAction(action);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.success && mode === "create") ref.current?.reset();
  }, [state, mode]);
  const fe = state?.fieldErrors ?? {};

  return (
    <form ref={ref} onSubmit={onSubmit} className="space-y-4">
      {state?.error ? <Alert>{state.error}</Alert> : null}
      {state?.success ? <Alert kind="success">{state.success}</Alert> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Groupe" htmlFor="s-group" error={fe.groupId?.[0]}>
          <select id="s-group" name="groupId" defaultValue={groupId} className="input" required>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Type" htmlFor="s-category">
          <select id="s-category" name="category" defaultValue={initial?.category ?? "ACTIVITE"} className="input">
            {Object.entries(SLOT_CATEGORIES).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Titre" htmlFor="s-title" error={fe.title?.[0]} className="sm:col-span-2">
          <input id="s-title" name="title" required className="input" defaultValue={initial?.title} placeholder="Ex. Atelier peinture, Collation, Sieste…" />
        </Field>
        <Field label="Début" htmlFor="s-start" error={fe.startTime?.[0]}>
          <input id="s-start" name="startTime" type="time" required className="input" defaultValue={initial?.startTime ?? "09:00"} />
        </Field>
        <Field label="Fin" htmlFor="s-end" error={fe.endTime?.[0]}>
          <input id="s-end" name="endTime" type="time" required className="input" defaultValue={initial?.endTime ?? "10:00"} />
        </Field>
        <Field label="Éducatrice responsable" htmlFor="s-educator">
          <select id="s-educator" name="educatorId" defaultValue={initial?.educatorId ?? ""} className="input">
            <option value="">—</option>
            {educators.map((e) => (
              <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
            ))}
          </select>
        </Field>
        <Field label="Lieu" htmlFor="s-location">
          <input id="s-location" name="location" className="input" defaultValue={initial?.location ?? ""} placeholder="Salle, cour, gymnase…" />
        </Field>
        <Field label="Description" htmlFor="s-desc" className="sm:col-span-2">
          <textarea id="s-desc" name="description" rows={2} className="input" defaultValue={initial?.description ?? ""} />
        </Field>
      </div>

      <fieldset>
        <legend className="label">{mode === "create" ? "Jours" : "Jour"}</legend>
        {fe.weekdays?.[0] ? <p className="mb-1 text-xs text-rose-600">{fe.weekdays[0]}</p> : null}
        <div className="flex flex-wrap gap-2">
          {WEEKDAYS.map((d) => (
            <label key={d.value} className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm has-checked:border-brand has-checked:bg-brand/10">
              <input
                type={mode === "create" ? "checkbox" : "radio"}
                name="weekdays"
                value={d.value}
                defaultChecked={initial ? initial.weekday === d.value : d.value <= 5}
                className="h-4 w-4 accent-teal-600"
              />
              {d.short}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex justify-end gap-2">
        {cancelHref ? <Link href={cancelHref} className="btn-secondary">Annuler</Link> : null}
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? "Enregistrement…" : mode === "create" ? "Ajouter le créneau" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}
