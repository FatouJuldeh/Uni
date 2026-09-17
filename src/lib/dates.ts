/** Utilitaires de dates. Les dates « jour » sont stockées en chaîne AAAA-MM-JJ. */

export const WEEKDAYS: { value: number; label: string; short: string }[] = [
  { value: 1, label: "Lundi", short: "Lun" },
  { value: 2, label: "Mardi", short: "Mar" },
  { value: 3, label: "Mercredi", short: "Mer" },
  { value: 4, label: "Jeudi", short: "Jeu" },
  { value: 5, label: "Vendredi", short: "Ven" },
  { value: 6, label: "Samedi", short: "Sam" },
  { value: 7, label: "Dimanche", short: "Dim" },
];

export function weekdayLabel(value: number) {
  return WEEKDAYS.find((d) => d.value === value)?.label ?? "";
}

/** Date locale du jour au format AAAA-MM-JJ. */
export function todayISO(): string {
  return toISODate(new Date());
}

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function isValidISODate(value: string | null | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = parseISODate(value);
  return !Number.isNaN(d.getTime()) && toISODate(d) === value;
}

export function addDays(iso: string, days: number): string {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/** 1 = lundi … 7 = dimanche */
export function isoWeekday(iso: string): number {
  const day = parseISODate(iso).getDay();
  return day === 0 ? 7 : day;
}

/** Lundi de la semaine contenant la date donnée. */
export function startOfWeek(iso: string): string {
  return addDays(iso, 1 - isoWeekday(iso));
}

/** Ex. « Mercredi 16 septembre 2026 » */
export function formatDateLong(iso: string): string {
  const s = parseISODate(iso).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatDateShort(iso: string): string {
  return parseISODate(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** Ex. « Mer. 16 sept. » */
export function formatDateMedium(iso: string): string {
  const s = parseISODate(iso).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Âge lisible (ex. « 2 ans 4 mois ») */
export function formatAge(birthISO: string, refISO = todayISO()): string {
  const birth = parseISODate(birthISO);
  const ref = parseISODate(refISO);
  let months =
    (ref.getFullYear() - birth.getFullYear()) * 12 +
    (ref.getMonth() - birth.getMonth());
  if (ref.getDate() < birth.getDate()) months -= 1;
  if (months < 0) return "—";
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (years === 0) return `${rest} mois`;
  if (rest === 0) return `${years} an${years > 1 ? "s" : ""}`;
  return `${years} an${years > 1 ? "s" : ""} ${rest} mois`;
}

export function ageInMonths(birthISO: string, refISO = todayISO()): number {
  const birth = parseISODate(birthISO);
  const ref = parseISODate(refISO);
  let months =
    (ref.getFullYear() - birth.getFullYear()) * 12 +
    (ref.getMonth() - birth.getMonth());
  if (ref.getDate() < birth.getDate()) months -= 1;
  return months;
}

export function isValidTime(value: string | null | undefined): value is string {
  return !!value && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

/** Convertit HH:MM en minutes depuis minuit. */
export function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function nowTimeHHMM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
