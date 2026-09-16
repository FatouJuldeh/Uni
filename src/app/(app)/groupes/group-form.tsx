"use client";

import { useFormAction } from "@/lib/use-form-action";
import Link from "next/link";
import type { ActionState } from "@/lib/forms";
import { Alert, Field } from "@/components/ui";

type EducatorOption = { id: string; firstName: string; lastName: string };

export function GroupForm({
  action,
  educators,
  initial,
  cancelHref,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  educators: EducatorOption[];
  initial?: {
    name: string;
    ageMin: number | null;
    ageMax: number | null;
    color: string;
    room: string | null;
    capacity: number | null;
    educatorIds: string[];
    leadId: string | null;
  };
  cancelHref: string;
}) {
  const { state, pending, onSubmit } = useFormAction(action);
  const fe = state?.fieldErrors ?? {};
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {state?.error ? <Alert>{state.error}</Alert> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nom du groupe" htmlFor="name" error={fe.name?.[0]} className="sm:col-span-2">
          <input id="name" name="name" required className="input" defaultValue={initial?.name} placeholder="Les Poussins" />
        </Field>
        <Field label="Âge minimum (mois)" htmlFor="ageMin" error={fe.ageMin?.[0]}>
          <input id="ageMin" name="ageMin" type="number" min={0} className="input" defaultValue={initial?.ageMin ?? ""} />
        </Field>
        <Field label="Âge maximum (mois)" htmlFor="ageMax" error={fe.ageMax?.[0]}>
          <input id="ageMax" name="ageMax" type="number" min={0} className="input" defaultValue={initial?.ageMax ?? ""} />
        </Field>
        <Field label="Salle" htmlFor="room" error={fe.room?.[0]}>
          <input id="room" name="room" className="input" defaultValue={initial?.room ?? ""} placeholder="Salle 1" />
        </Field>
        <Field label="Capacité (places)" htmlFor="capacity" error={fe.capacity?.[0]}>
          <input id="capacity" name="capacity" type="number" min={0} className="input" defaultValue={initial?.capacity ?? ""} />
        </Field>
        <Field label="Couleur" htmlFor="color" error={fe.color?.[0]}>
          <input id="color" name="color" type="color" className="h-10 w-20 cursor-pointer rounded-lg border border-slate-300" defaultValue={initial?.color ?? "#0d9488"} />
        </Field>
      </div>

      <fieldset>
        <legend className="label">Éducatrices du groupe</legend>
        {educators.length === 0 ? (
          <p className="text-sm text-slate-500">
            Aucune éducatrice enregistrée. <Link href="/educatrices/nouveau" className="text-brand underline">Ajouter une éducatrice</Link>
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="table">
              <thead>
                <tr>
                  <th>Éducatrice</th>
                  <th className="w-32">Dans le groupe</th>
                  <th className="w-32">Référente</th>
                </tr>
              </thead>
              <tbody>
                {educators.map((e) => (
                  <tr key={e.id}>
                    <td>{e.firstName} {e.lastName}</td>
                    <td>
                      <input type="checkbox" name="educatorIds" value={e.id} defaultChecked={initial?.educatorIds.includes(e.id)} className="h-4 w-4 accent-teal-600" />
                    </td>
                    <td>
                      <input type="radio" name="leadId" value={e.id} defaultChecked={initial?.leadId === e.id} className="h-4 w-4 accent-teal-600" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-1 text-xs text-slate-400">Cochez les éducatrices affectées ; la référente doit aussi être cochée.</p>
      </fieldset>

      <div className="flex justify-end gap-2">
        <Link href={cancelHref} className="btn-secondary">Annuler</Link>
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}
