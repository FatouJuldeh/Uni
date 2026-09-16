"use client";

import { useFormAction } from "@/lib/use-form-action";
import Link from "next/link";
import type { ActionState } from "@/lib/forms";
import { ROLE_LABELS, type Role } from "@/lib/auth-constants";
import { Alert, Field } from "@/components/ui";

export function UserForm({
  action,
  educators,
  initial,
  isSelf = false,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  educators: { id: string; firstName: string; lastName: string }[];
  initial?: { name: string; email: string; role: Role; educatorId: string | null; active: boolean };
  isSelf?: boolean;
}) {
  const { state, pending, onSubmit } = useFormAction(action);
  const fe = state?.fieldErrors ?? {};
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {state?.error ? <Alert>{state.error}</Alert> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nom complet" htmlFor="u-name" error={fe.name?.[0]}>
          <input id="u-name" name="name" required className="input" defaultValue={initial?.name} />
        </Field>
        <Field label="Courriel (identifiant)" htmlFor="u-email" error={fe.email?.[0]}>
          <input id="u-email" name="email" type="email" required className="input" defaultValue={initial?.email} />
        </Field>
        <Field label="Rôle" htmlFor="u-role" error={fe.role?.[0]}>
          <select id="u-role" name="role" className="input" defaultValue={initial?.role ?? "EDUCATRICE"} disabled={isSelf}>
            {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
          {isSelf ? <input type="hidden" name="role" value={initial?.role} /> : null}
        </Field>
        <Field label="Fiche éducatrice liée" htmlFor="u-educator" hint="Optionnel : associe ce compte à une membre de l'équipe.">
          <select id="u-educator" name="educatorId" className="input" defaultValue={initial?.educatorId ?? ""}>
            <option value="">Aucune</option>
            {educators.map((e) => (
              <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
            ))}
          </select>
        </Field>
        <Field
          label={initial ? "Nouveau mot de passe" : "Mot de passe"}
          htmlFor="u-password"
          error={fe.password?.[0]}
          hint={initial ? "Laissez vide pour ne pas le changer. Minimum 8 caractères." : "Minimum 8 caractères."}
        >
          <input id="u-password" name="password" type="password" autoComplete="new-password" className="input" required={!initial} minLength={8} />
        </Field>
        {initial ? (
          <label className="flex items-center gap-2 self-end pb-2 text-sm text-slate-700">
            <input type="checkbox" name="active" defaultChecked={initial.active} disabled={isSelf} className="h-4 w-4 accent-teal-600" />
            Compte actif
            {isSelf ? <input type="hidden" name="active" value="on" /> : null}
          </label>
        ) : null}
      </div>
      <div className="flex justify-end gap-2">
        <Link href="/utilisateurs" className="btn-secondary">Annuler</Link>
        <button type="submit" className="btn-primary" disabled={pending}>{pending ? "Enregistrement…" : "Enregistrer"}</button>
      </div>
    </form>
  );
}
