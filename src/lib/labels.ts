/** Libellés partagés (statuts, catégories…) */

export const ATTENDANCE_STATUS = {
  PRESENT: { label: "Présent", color: "bg-emerald-100 text-emerald-800 ring-emerald-200" },
  RETARD: { label: "En retard", color: "bg-amber-100 text-amber-800 ring-amber-200" },
  ABSENT: { label: "Absent", color: "bg-rose-100 text-rose-800 ring-rose-200" },
  EXCUSE: { label: "Absence excusée", color: "bg-slate-100 text-slate-700 ring-slate-200" },
} as const;
export type AttendanceStatus = keyof typeof ATTENDANCE_STATUS;
export const ATTENDANCE_STATUSES = Object.keys(ATTENDANCE_STATUS) as AttendanceStatus[];

export const LEAVE_TYPES = {
  CONGE: "Congé",
  MALADIE: "Maladie",
  FORMATION: "Formation",
  AUTRE: "Autre",
} as const;
export type LeaveType = keyof typeof LEAVE_TYPES;

export const SLOT_CATEGORIES = {
  ACCUEIL: { label: "Accueil", color: "bg-sky-100 border-sky-300 text-sky-900" },
  ACTIVITE: { label: "Activité", color: "bg-teal-100 border-teal-300 text-teal-900" },
  REPAS: { label: "Repas / collation", color: "bg-orange-100 border-orange-300 text-orange-900" },
  SIESTE: { label: "Sieste / repos", color: "bg-violet-100 border-violet-300 text-violet-900" },
  SORTIE: { label: "Sortie / extérieur", color: "bg-lime-100 border-lime-300 text-lime-900" },
  AUTRE: { label: "Autre", color: "bg-slate-100 border-slate-300 text-slate-900" },
} as const;
export type SlotCategory = keyof typeof SLOT_CATEGORIES;

export const GENDERS = { F: "Fille", M: "Garçon", AUTRE: "Autre" } as const;

export const GUARDIAN_RELATIONS = ["Mère", "Père", "Tuteur·rice", "Grand-parent", "Autre"];

export const POSITIONS = [
  "Directrice",
  "Éducatrice",
  "Aide-éducatrice",
  "Stagiaire",
  "Cuisinier·ère",
  "Autre",
];
