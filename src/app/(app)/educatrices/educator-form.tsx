"use client";

import { useFormAction } from "@/lib/use-form-action";
import Link from "next/link";
import type { ActionState } from "@/lib/forms";
import { POSITIONS } from "@/lib/labels";
import { WEEKDAYS } from "@/lib/dates";
import { Alert, Field } from "@/components/ui";

export function EducatorForm({
  action,
  initial,
  cancelHref,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  initial?: {
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    position: string;
    hireDate: string | null;
    qualifications: string | null;
    notes: string | null;
    active: boolean;
    shifts: { weekday: number; startTime: string; endTime: string }[];
  };
  cancelHref: string;
}) {
  const { state, pending, onSubmit } = useFormAction(action);
  const fe = state?.fieldErrors ?? {};
  const shiftFor = (day: number) => initial?.shifts.find((s) => s.weekday === day);
  const positionKnown = !initial || POSITIONS.includes(initial.position);

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {state?.error ? <Alert>{state.error}</Alert> : null}

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-800">Identité et contact</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Prénom" htmlFor="firstName" error={fe.firstName?.[0]}>
            <input id="firstName" name="firstName" required className="input" defaultValue={initial?.firstName} />
          </Field>
          <Field label="Nom" htmlFor="lastName" error={fe.lastName?.[0]}>
            <input id="lastName" name="lastName" required className="input" defaultValue={initial?.lastName} />
          </Field>
          <Field label="Courriel" htmlFor="email" error={fe.email?.[0]}>
            <input id="email" name="email" type="email" className="input" defaultValue={initial?.email ?? ""} />
          </Field>
          <Field label="Téléphone" htmlFor="phone" error={fe.phone?.[0]}>
            <input id="phone" name="phone" type="tel" className="input" defaultValue={initial?.phone ?? ""} />
          </Field>
          <Field label="Poste" htmlFor="position" error={fe.position?.[0]}>
            <input
              id="position"
              name="position"
              list="positions"
              className="input"
              defaultValue={initial?.position ?? "Éducatrice"}
              required
            />
            <datalist id="positions">
              {POSITIONS.map((p) => (
                <option key={p} value={p} />
              ))}
              {!positionKnown && initial ? <option value={initial.position} /> : null}
            </datalist>
          </Field>
          <Field label="Date d'embauche" htmlFor="hireDate" error={fe.hireDate?.[0]}>
            <input id="hireDate" name="hireDate" type="date" className="input" defaultValue={initial?.hireDate ?? ""} />
          </Field>
          <Field label="Qualifications / formations" htmlFor="qualifications" error={fe.qualifications?.[0]} className="sm:col-span-2">
            <textarea id="qualifications" name="qualifications" rows={2} className="input" defaultValue={initial?.qualifications ?? ""} />
          </Field>
          <Field label="Notes" htmlFor="notes" error={fe.notes?.[0]} className="sm:col-span-2">
            <textarea id="notes" name="notes" rows={2} className="input" defaultValue={initial?.notes ?? ""} />
          </Field>
          {initial ? (
            <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
              <input type="checkbox" name="active" defaultChecked={initial.active} className="h-4 w-4 accent-teal-600" />
              Membre actif de l&apos;équipe
            </label>
          ) : null}
        </div>
      </div>

      <div>
        <h3 className="mb-1 text-sm font-semibold text-slate-800">Horaire de travail hebdomadaire</h3>
        <p className="mb-3 text-xs text-slate-400">Laissez vide les jours de repos.</p>
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="table">
            <thead>
              <tr>
                <th>Jour</th>
                <th className="w-36">Début</th>
                <th className="w-36">Fin</th>
              </tr>
            </thead>
            <tbody>
              {WEEKDAYS.map((d) => {
                const s = shiftFor(d.value);
                return (
                  <tr key={d.value}>
                    <td className="font-medium text-slate-700">{d.label}</td>
                    <td>
                      <input type="time" name={`shift-${d.value}-start`} defaultValue={s?.startTime ?? ""} className="input py-1" aria-label={`Début ${d.label}`} />
                    </td>
                    <td>
                      <input type="time" name={`shift-${d.value}-end`} defaultValue={s?.endTime ?? ""} className="input py-1" aria-label={`Fin ${d.label}`} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Link href={cancelHref} className="btn-secondary">Annuler</Link>
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}
