import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { requireUser, isAdmin } from "@/lib/auth";
import { todayISO, isoWeekday, WEEKDAYS } from "@/lib/dates";
import { Avatar, Badge, EmptyState, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Éducatrices" };

export default async function EducatorsPage(props: PageProps<"/educatrices">) {
  const user = await requireUser();
  const sp = await props.searchParams;
  const showInactive = sp.inactifs === "1";
  const today = todayISO();
  const weekday = isoWeekday(today);

  const educators = await prisma.educator.findMany({
    where: showInactive ? {} : { active: true },
    include: {
      groups: { include: { group: true } },
      shifts: { orderBy: { weekday: "asc" } },
      leaves: { where: { startDate: { lte: today }, endDate: { gte: today } } },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  return (
    <>
      <PageHeader
        title="Éducatrices"
        subtitle="Personnel, horaires et affectations."
        actions={
          <>
            <Link href="/educatrices/pointage" className="btn-secondary">Pointage du jour</Link>
            {isAdmin(user) ? <Link href="/educatrices/nouveau" className="btn-primary">Ajouter</Link> : null}
          </>
        }
      />

      <div className="mb-4 text-sm">
        <Link href={showInactive ? "/educatrices" : "/educatrices?inactifs=1"} className="text-brand hover:underline">
          {showInactive ? "Masquer les anciennes membres" : "Afficher les anciennes membres"}
        </Link>
      </div>

      {educators.length === 0 ? (
        <EmptyState
          title="Aucune éducatrice"
          description="Ajoutez les membres de votre équipe pour définir leurs horaires et leurs groupes."
          action={isAdmin(user) ? <Link href="/educatrices/nouveau" className="btn-primary">Ajouter une éducatrice</Link> : null}
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Poste</th>
                <th>Groupes</th>
                <th>Horaire</th>
                <th>Aujourd&apos;hui</th>
              </tr>
            </thead>
            <tbody>
              {educators.map((e) => {
                const todayShift = e.shifts.find((s) => s.weekday === weekday);
                const workDays = e.shifts.map((s) => WEEKDAYS.find((d) => d.value === s.weekday)?.short).join(", ");
                return (
                  <tr key={e.id}>
                    <td>
                      <Link href={`/educatrices/${e.id}`} className="flex items-center gap-3">
                        <Avatar name={`${e.firstName} ${e.lastName}`} color={e.groups[0]?.group.color} />
                        <span>
                          <span className="block font-medium text-slate-900">
                            {e.firstName} {e.lastName}
                            {!e.active ? <Badge className="ml-2 bg-slate-100 text-slate-500 ring-slate-200">Inactive</Badge> : null}
                          </span>
                          {e.phone ? <span className="text-xs text-slate-400">{e.phone}</span> : null}
                        </span>
                      </Link>
                    </td>
                    <td className="text-slate-600">{e.position}</td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {e.groups.length === 0 ? (
                          <span className="text-slate-400">—</span>
                        ) : (
                          e.groups.map((ge) => (
                            <span key={ge.groupId} className="rounded-full px-2 py-0.5 text-xs text-white" style={{ backgroundColor: ge.group.color }}>
                              {ge.group.name}{ge.isLead ? " ★" : ""}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="text-xs text-slate-600">{workDays || <span className="text-slate-400">Non défini</span>}</td>
                    <td>
                      {e.leaves.length > 0 ? (
                        <Badge className="bg-amber-100 text-amber-800 ring-amber-200">En congé</Badge>
                      ) : todayShift ? (
                        <span className="text-sm tabular-nums text-slate-700">{todayShift.startTime}–{todayShift.endTime}</span>
                      ) : (
                        <span className="text-xs text-slate-400">Repos</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
