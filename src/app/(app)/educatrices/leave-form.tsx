"use client";

import { useFormAction } from "@/lib/use-form-action";
import { useEffect, useRef } from "react";
import { LEAVE_TYPES } from "@/lib/labels";
import { Alert, Field } from "@/components/ui";
import { addLeave } from "./actions";

export function LeaveForm({ educatorId, today }: { educatorId: string; today: string }) {
  const { state, pending, onSubmit } = useFormAction(addLeave);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.success) ref.current?.reset();
  }, [state]);
  const fe = state?.fieldErrors ?? {};
  return (
    <form ref={ref} onSubmit={onSubmit} className="space-y-3">
      <input type="hidden" name="educatorId" value={educatorId} />
      {state?.error ? <Alert>{state.error}</Alert> : null}
      {state?.success ? <Alert kind="success">{state.success}</Alert> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Du" htmlFor="l-start" error={fe.startDate?.[0]}>
          <input id="l-start" type="date" name="startDate" required defaultValue={today} className="input" />
        </Field>
        <Field label="Au" htmlFor="l-end" error={fe.endDate?.[0]} hint="Laissez vide pour une seule journée">
          <input id="l-end" type="date" name="endDate" className="input" />
        </Field>
        <Field label="Type" htmlFor="l-type">
          <select id="l-type" name="type" className="input">
            {Object.entries(LEAVE_TYPES).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </Field>
        <Field label="Note" htmlFor="l-note">
          <input id="l-note" name="note" className="input" />
        </Field>
      </div>
      <button type="submit" className="btn-secondary" disabled={pending}>
        {pending ? "Ajout…" : "Ajouter le congé"}
      </button>
    </form>
  );
}
