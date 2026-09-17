"use client";

import { useFormAction } from "@/lib/use-form-action";
import { login } from "./actions";
import { Alert, Field } from "@/components/ui";

export function LoginForm({ next }: { next: string }) {
  const { state, pending, onSubmit } = useFormAction(login);
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      {state?.error ? <Alert>{state.error}</Alert> : null}
      <Field label="Courriel" htmlFor="email">
        <input id="email" name="email" type="email" autoComplete="email" required className="input" />
      </Field>
      <Field label="Mot de passe" htmlFor="password">
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="input"
        />
      </Field>
      <button type="submit" className="btn-primary w-full" disabled={pending}>
        {pending ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}
