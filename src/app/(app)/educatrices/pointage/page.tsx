import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { addDays, formatDateLong, isValidISODate, isoWeekday, nowTimeHHMM, todayISO } from "@/lib/dates";
import { PageHeader } from "@/components/ui";
import { Icon } from "@/components/icons";
import { EducatorSheet, type EducatorRow } from "./educator-sheet";
import { goToPointageDate } from "../actions";

export const metadata: Metadata = { title: "Pointage des éducatrices" };

export default async function EducatorAttendancePage(props: PageProps<"/educatrices/pointage">) {
  await requireUser();
  const sp = await props.searchParams;
  const today = todayISO();
  const date = typeof sp.date === "string" && isValidISODate(sp.date) ? sp.date : today;
  const weekday = isoWeekday(date);

  const educators = await prisma.educator.findMany({
    where: { active: true },
    include: {
      shifts: { where: { weekday } },
      leaves: { where: { startDate: { lte: date }, endDate: { gte: date } } },
      attendances: { where: { date } },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  const rows: EducatorRow[] = educators.map((e) => {
    const a = e.attendances[0];
    const s = e.shifts[0];
    return {
      id: e.id,
      name: `${e.firstName} ${e.lastName}`,
      position: e.position,
      shift: s ? `${s.startTime}–${s.endTime}` : null,
      onLeave: e.leaves.length > 0,
      status: (a?.status as EducatorRow["status"]) ?? "",
      arrival: a?.arrivalTime ?? "",
      departure: a?.departureTime ?? "",
      note: a?.note ?? "",
    };
  });

  return (
    <>
      <PageHeader
        title="Pointage des éducatrices"
        subtitle={formatDateLong(date)}
        actions={<Link href="/educatrices" className="btn-secondary">Retour à l&apos;équipe</Link>}
      />
      <div className="mb-4 flex items-center gap-1">
        <Link href={`/educatrices/pointage?date=${addDays(date, -1)}`} className="btn-secondary px-2" aria-label="Jour précédent"><Icon name="chevronLeft" /></Link>
        <form action={goToPointageDate} className="flex items-center gap-1">
          <input type="date" name="date" defaultValue={date} className="input w-auto py-1.5" />
          <button type="submit" className="btn-secondary px-2.5 py-1.5 text-xs">OK</button>
        </form>
        <Link href={`/educatrices/pointage?date=${addDays(date, 1)}`} className="btn-secondary px-2" aria-label="Jour suivant"><Icon name="chevronRight" /></Link>
        {date !== today ? <Link href="/educatrices/pointage" className="btn-ghost text-xs">Aujourd&apos;hui</Link> : null}
      </div>
      <EducatorSheet key={date} date={date} rows={rows} nowTime={nowTimeHHMM()} />
    </>
  );
}
