import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { addDays, formatDateLong, isValidISODate, nowTimeHHMM, todayISO } from "@/lib/dates";
import type { AttendanceStatus } from "@/lib/labels";
import { PageHeader } from "@/components/ui";
import { Icon } from "@/components/icons";
import { AttendanceSheet, type SheetRow } from "./attendance-sheet";
import { goToDate } from "./actions";

export const metadata: Metadata = { title: "Présences" };

export default async function AttendancePage(props: PageProps<"/presences">) {
  await requireUser();
  const sp = await props.searchParams;
  const today = todayISO();
  const date = typeof sp.date === "string" && isValidISODate(sp.date) ? sp.date : today;
  const groupId = typeof sp.groupe === "string" ? sp.groupe : "";

  const [groups, children] = await Promise.all([
    prisma.group.findMany({ orderBy: { name: "asc" } }),
    prisma.child.findMany({
      where: { active: true, ...(groupId ? { groupId } : {}) },
      include: { group: true, attendances: { where: { date } } },
      orderBy: [{ group: { name: "asc" } }, { lastName: "asc" }, { firstName: "asc" }],
    }),
  ]);

  const rows: SheetRow[] = children.map((c) => {
    const a = c.attendances[0];
    return {
      id: c.id,
      name: `${c.firstName} ${c.lastName}`,
      groupName: c.group?.name ?? null,
      allergies: c.allergies,
      status: (a?.status as AttendanceStatus) ?? "",
      arrival: a?.arrivalTime ?? "",
      departure: a?.departureTime ?? "",
      note: a?.note ?? "",
    };
  });

  const link = (d: string, g = groupId) => `/presences?date=${d}${g ? `&groupe=${g}` : ""}`;

  return (
    <>
      <PageHeader
        title="Présences"
        subtitle={formatDateLong(date)}
        actions={<Link href="/presences/historique" className="btn-secondary">Historique</Link>}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1">
          <Link href={link(addDays(date, -1))} className="btn-secondary px-2" aria-label="Jour précédent">
            <Icon name="chevronLeft" />
          </Link>
          <form action={goToDate} className="flex items-center gap-1">
            <input type="hidden" name="groupId" value={groupId} />
            <input type="date" name="date" defaultValue={date} className="input w-auto py-1.5" aria-label="Choisir une date" />
            <button type="submit" className="btn-secondary px-2.5 py-1.5 text-xs">OK</button>
          </form>
          <Link href={link(addDays(date, 1))} className="btn-secondary px-2" aria-label="Jour suivant">
            <Icon name="chevronRight" />
          </Link>
          {date !== today ? (
            <Link href={link(today)} className="btn-ghost text-xs">Aujourd&apos;hui</Link>
          ) : null}
        </div>

        <nav className="flex flex-wrap gap-1" aria-label="Groupes">
          <Link
            href={link(date, "")}
            className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${!groupId ? "bg-slate-800 text-white ring-slate-800" : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"}`}
          >
            Tous
          </Link>
          {groups.map((g) => (
            <Link
              key={g.id}
              href={link(date, g.id)}
              className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${groupId === g.id ? "text-white" : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"}`}
              style={groupId === g.id ? { backgroundColor: g.color, borderColor: g.color } : undefined}
            >
              {g.name}
            </Link>
          ))}
        </nav>
      </div>

      <AttendanceSheet key={`${date}-${groupId}`} date={date} groupId={groupId} rows={rows} nowTime={nowTimeHHMM()} />
    </>
  );
}
