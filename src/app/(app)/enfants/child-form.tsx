"use client";

import { useFormAction } from "@/lib/use-form-action";
import Link from "next/link";
import type { ActionState } from "@/lib/forms";
import { GENDERS, GUARDIAN_RELATIONS } from "@/lib/labels";
import { Alert, Field } from "@/components/ui";

type GroupOption = { id: string; name: string };

export function ChildForm({
  action,
  groups,
  initial,
  cancelHref,
  withGuardian = false,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  groups: GroupOption[];
  initial?: {
    firstName: string;
    lastName: string;
    birthDate: string;
    gender: string | null;
    groupId: string | null;
    allergies: string | null;
    medicalNotes: string | null;
    notes: string | null;
    startDate: string | null;
    active: boolean;
  };
  cancelHref: string;
  withGuardian?: boolean;
}) {
  const { state, pending, onSubmit } = useFormAction(action);
  const fe = state?.fieldErrors ?? {};
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {state?.error ? <Alert>{state.error}</Alert> : null}

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-800">Identité</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Prénom" htmlFor="firstName" error={fe.firstName?.[0]}>
            <input id="firstName" name="firstName" required className="input" defaultValue={initial?.firstName} />
          </Field>
          <Field label="Nom" htmlFor="lastName" error={fe.lastName?.[0]}>
            <input id="lastName" name="lastName" required className="input" defaultValue={initial?.lastName} />
          </Field>
          <Field label="Date de naissance" htmlFor="birthDate" error={fe.birthDate?.[0]}>
            <input id="birthDate" name="birthDate" type="date" required className="input" defaultValue={initial?.birthDate} />
          </Field>
          <Field label="Sexe" htmlFor="gender" error={fe.gender?.[0]}>
            <select id="gender" name="gender" className="input" defaultValue={initial?.gender ?? ""}>
              <option value="">Non précisé</option>
              {Object.entries(GENDERS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </Field>
          <Field label="Groupe" htmlFor="groupId" error={fe.groupId?.[0]}>
            <select id="groupId" name="groupId" className="input" defaultValue={initial?.groupId ?? ""}>
              <option value="">Sans groupe</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Date d'entrée" htmlFor="startDate" error={fe.startDate?.[0]}>
            <input id="startDate" name="startDate" type="date" className="input" defaultValue={initial?.startDate ?? ""} />
          </Field>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-800">Santé et remarques</h3>
        <div className="grid gap-4">
          <Field label="Allergies" htmlFor="allergies" error={fe.allergies?.[0]} hint="Ex. arachides, lactose. Affiché en évidence sur la feuille de présence.">
            <input id="allergies" name="allergies" className="input" defaultValue={initial?.allergies ?? ""} />
          </Field>
          <Field label="Informations médicales" htmlFor="medicalNotes" error={fe.medicalNotes?.[0]}>
            <textarea id="medicalNotes" name="medicalNotes" rows={2} className="input" defaultValue={initial?.medicalNotes ?? ""} />
          </Field>
          <Field label="Notes diverses" htmlFor="notes" error={fe.notes?.[0]}>
            <textarea id="notes" name="notes" rows={2} className="input" defaultValue={initial?.notes ?? ""} />
          </Field>
          {initial ? (
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" name="active" defaultChecked={initial.active} className="h-4 w-4 accent-teal-600" />
              Enfant actuellement inscrit (décochez en cas de départ)
            </label>
          ) : null}
        </div>
      </div>

      {withGuardian ? (
        <div>
          <h3 className="mb-1 text-sm font-semibold text-slate-800">Contact principal</h3>
          <p className="mb-3 text-xs text-slate-400">Vous pourrez ajouter d&apos;autres contacts ensuite.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nom du parent / tuteur" htmlFor="guardianName">
              <input id="guardianName" name="guardianName" className="input" />
            </Field>
            <Field label="Lien" htmlFor="guardianRelation">
              <select id="guardianRelation" name="guardianRelation" className="input">
                {GUARDIAN_RELATIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </Field>
            <Field label="Téléphone" htmlFor="guardianPhone">
              <input id="guardianPhone" name="guardianPhone" type="tel" className="input" />
            </Field>
            <Field label="Courriel" htmlFor="guardianEmail">
              <input id="guardianEmail" name="guardianEmail" type="email" className="input" />
            </Field>
          </div>
        </div>
      ) : null}

      <div className="flex justify-end gap-2">
        <Link href={cancelHref} className="btn-secondary">Annuler</Link>
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}
