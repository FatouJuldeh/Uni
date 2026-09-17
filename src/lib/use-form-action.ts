"use client";

import { startTransition, useActionState, type FormEvent } from "react";
import type { ActionState } from "@/lib/forms";

/**
 * Enveloppe `useActionState` pour soumettre le formulaire manuellement.
 * React 19 réinitialise les champs d'un formulaire soumis via `action={…}` ;
 * en passant par `onSubmit`, la saisie de l'utilisateur est conservée en cas d'erreur.
 */
export function useFormAction(action: (prev: ActionState, formData: FormData) => Promise<ActionState>) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  };
  return { state, pending, onSubmit };
}
