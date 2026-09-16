/** Constantes d'authentification utilisables côté client comme côté serveur. */
export const SESSION_COOKIE = "garderie_session";

export type Role = "ADMIN" | "EDUCATRICE" | "PARENT";

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administration",
  EDUCATRICE: "Éducatrice",
  PARENT: "Parent",
};
