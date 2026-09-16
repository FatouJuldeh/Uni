import type { Role } from "@/lib/auth-constants";

/**
 * Registre des modules de l'application.
 *
 * Pour ajouter une nouvelle fonctionnalité (ex. facturation, messagerie, menus) :
 *  1. créer un dossier de pages dans `src/app/(app)/<slug>/`
 *  2. ajouter une entrée ci-dessous : elle apparaîtra automatiquement dans le menu.
 *  3. (optionnel) ajouter les tables nécessaires dans `prisma/schema.prisma`
 *     puis lancer `npx prisma migrate dev --name <nom>`.
 */
export type AppModule = {
  slug: string;
  href: string;
  label: string;
  description: string;
  icon: ModuleIcon;
  /** Rôles autorisés à voir le module dans le menu. */
  roles: Role[];
  /** Regroupement dans le menu. */
  section: "Quotidien" | "Gestion" | "Administration";
};

export type ModuleIcon =
  | "home"
  | "check"
  | "child"
  | "group"
  | "educator"
  | "calendar"
  | "users"
  | "settings";

export const MODULES: AppModule[] = [
  {
    slug: "tableau-de-bord",
    href: "/",
    label: "Tableau de bord",
    description: "Vue d'ensemble de la journée",
    icon: "home",
    roles: ["ADMIN", "EDUCATRICE"],
    section: "Quotidien",
  },
  {
    slug: "presences",
    href: "/presences",
    label: "Présences",
    description: "Feuille de présence quotidienne des enfants",
    icon: "check",
    roles: ["ADMIN", "EDUCATRICE"],
    section: "Quotidien",
  },
  {
    slug: "emploi-du-temps",
    href: "/emploi-du-temps",
    label: "Emploi du temps",
    description: "Planning hebdomadaire des activités par groupe",
    icon: "calendar",
    roles: ["ADMIN", "EDUCATRICE"],
    section: "Quotidien",
  },
  {
    slug: "enfants",
    href: "/enfants",
    label: "Enfants",
    description: "Dossiers des enfants et contacts des parents",
    icon: "child",
    roles: ["ADMIN", "EDUCATRICE"],
    section: "Gestion",
  },
  {
    slug: "groupes",
    href: "/groupes",
    label: "Groupes",
    description: "Groupes d'âge, salles et éducatrices référentes",
    icon: "group",
    roles: ["ADMIN", "EDUCATRICE"],
    section: "Gestion",
  },
  {
    slug: "educatrices",
    href: "/educatrices",
    label: "Éducatrices",
    description: "Personnel, horaires de travail, congés et pointage",
    icon: "educator",
    roles: ["ADMIN", "EDUCATRICE"],
    section: "Gestion",
  },
  {
    slug: "utilisateurs",
    href: "/utilisateurs",
    label: "Utilisateurs",
    description: "Comptes d'accès et rôles",
    icon: "users",
    roles: ["ADMIN"],
    section: "Administration",
  },
];

export function modulesForRole(role: Role) {
  return MODULES.filter((m) => m.roles.includes(role));
}
