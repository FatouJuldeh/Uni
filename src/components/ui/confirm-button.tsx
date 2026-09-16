"use client";

import type { ReactNode } from "react";

/** Bouton de soumission qui demande confirmation avant d'envoyer le formulaire parent. */
export function ConfirmButton({
  children,
  message = "Confirmer cette action ?",
  className = "btn-danger",
  formAction,
}: {
  children: ReactNode;
  message?: string;
  className?: string;
  formAction?: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <button
      type="submit"
      className={className}
      formAction={formAction}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
