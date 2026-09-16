import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { addDays, formatDateShort, isValidISODate, todayISO } from "@/lib/dates";
import { ATTENDANCE_STATUS, type AttendanceStatus } from "@/lib/labels";
import { Badge, Card, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Historique des présences" };

export default async function AttendanceHistoryPage(props: PageProps<"/presences/historique">) {
  await requireUser();
  const sp = await props.searchParams;
  const today = todayISO();
  const to = typeof sp.au === "string" && isValidISODate(sp.au) ? sp.au : today;
  const from = typeof sp.du === "string" && isValidISODate(sp.du) ? sp.du : addDays(to, -29);
  const groupId = typeof sp.groupe === "string" ? sp.groupe : "";

  const [groups, children, distinctDays] = await Promise.all([
    prisma.group.findMany({ orderBy: { name: "asc" } }),
    prisma.child.findMany({
      where: { active: true, ...(groupId ? { groupId } : {}) },
      include: { group: true, attendances: { where: { date: { gte: from, lte: to } } } },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
    prisma.attendance.findMany({
      where: { date: { gte: from, lte: to } },
      distinct: ["date"],
      select: { date: true },
    }),
  ]);
  const daysRecorded = distinctDays.length;

  const totals: Record<AttendanceStatus, number> = { PRESENT: 0, RETARD: 0, ABSENT: 0, EXCUSE: 0 };
  const rows = children.map((c) => {
    const counts: Record<AttendanceStatus, number> = { PRESENT: 0, RETARD: 0, ABSENT: 0, EXCUSE: 0 };
    for (const a of c.attendances) {
      counts[a.status as AttendanceStatus] += 1;
      totals[a.status as AttendanceStatus] += 1;
    }
    const present = counts.PRESENT + counts.RETARD;
    const rate = daysRecorded ? Math.round((present / daysRecorded) * 100) : 0;
    return { child: c, counts, present, rate };
  });

  return (
    <>
      <PageHeader
        title="Historique des présences"
        subtitle={`Du ${formatDateShort(from)} au ${formatDateShort(to)} · ${daysRecorded} jour${daysRecorded > 1 ? "s" : ""} pointé${daysRecorded > 1 ? "s" : ""}`}
        actions={<Link href="/presences" className="btn-secondary">Feuille du jour</Link>}
      />

      <form className="card mb-4 flex flex-wrap items-end gap-3 p-4">
        <div>
          <label htmlFor="du" className="label">Du</label>
          <input id="du" type="date" name="du" defaultValue={from} className="input" />
        </div>
        <div>
          <label htmlFor="au" className="label">Au</label>
          <input id="au" type="date" name="au" defaultValue={to} className="input" />
        </div>
        <div className="min-w-40">
          <label htmlFor="groupe" className="label">Groupe</label>
          <select id="groupe" name="groupe" defaultValue={groupId} className="input">
            <option value="">Tous</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn-secondary">Afficher</button>
      </form>

      <div className="mb-4 flex flex-wrap gap-2">
        {(Object.keys(ATTENDANCE_STATUS) as AttendanceStatus[]).map((k) => (
          <Badge key={k} className={ATTENDANCE_STATUS[k].color}>
            {ATTENDANCE_STATUS[k].label} : {totals[k]}
          </Badge>
        ))}
      </div>

      <Card>
        {rows.length === 0 ? (
          <p className="text-sm text-slate-500">Aucun enfant dans cette sélection.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Enfant</th>
                  <th>Groupe</th>
                  <th className="text-right">Présent</th>
                  <th className="text-right">Retard</th>
                  <th className="text-right">Absent</th>
                  <th className="text-right">Excusé</th>
                  <th className="w-40">Taux de présence</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ child, counts, rate }) => (
                  <tr key={child.id}>
                    <td>
                      <Link href={`/enfants/${child.id}`} className="font-medium text-slate-900 hover:underline">
                        {child.firstName} {child.lastName}
                      </Link>
                    </td>
                    <td className="text-slate-600">{child.group?.name ?? "—"}</td>
                    <td className="text-right tabular-nums">{counts.PRESENT}</td>
                    <td className="text-right tabular-nums">{counts.RETARD}</td>
                    <td className="text-right tabular-nums">{counts.ABSENT}</td>
                    <td className="text-right tabular-nums">{counts.EXCUSE}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${rate}%` }} />
                        </div>
                        <span className="w-10 text-right text-xs tabular-nums text-slate-500">{rate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
