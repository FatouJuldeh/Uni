import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser, isAdmin } from "@/lib/auth";
import { WEEKDAYS, formatDateShort, todayISO, addDays, formatDateMedium } from "@/lib/dates";
import { LEAVE_TYPES, type LeaveType } from "@/lib/labels";
import { Badge, Card, PageHeader } from "@/components/ui";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { LeaveForm } from "../leave-form";
import { deleteEducator, deleteLeave } from "../actions";

export default async function EducatorDetailPage(props: PageProps<"/educatrices/[id]">) {
  const user = await requireUser();
  const { id } = await props.params;
  const today = todayISO();
  const educator = await prisma.educator.findUnique({
    where: { id },
    include: {
      groups: { include: { group: true } },
      shifts: { orderBy: { weekday: "asc" } },
      leaves: { orderBy: { startDate: "desc" }, take: 20 },
      attendances: { where: { date: { gte: addDays(today, -30) } }, orderBy: { date: "desc" } },
      user: { select: { email: true, role: true } },
    },
  });
  if (!educator) notFound();
  const admin = isAdmin(user);
  const weeklyHours = educator.shifts.reduce((sum, s) => {
    const [sh, sm] = s.startTime.split(":").map(Number);
    const [eh, em] = s.endTime.split(":").map(Number);
    return sum + (eh * 60 + em - (sh * 60 + sm)) / 60;
  }, 0);

  return (
    <>
      <PageHeader
        title={`${educator.firstName} ${educator.lastName}`}
        subtitle={
          <>
            {educator.position}
            {educator.hireDate ? ` · en poste depuis le ${formatDateShort(educator.hireDate)}` : ""}
            {!educator.active ? " · inactive" : ""}
          </>
        }
        actions={
          admin ? (
            <>
              <Link href={`/educatrices/${educator.id}/modifier`} className="btn-primary">Modifier</Link>
              <form action={deleteEducator}>
                <input type="hidden" name="id" value={educator.id} />
                <ConfirmButton message={`Supprimer ${educator.firstName} ${educator.lastName} ? Pour un départ, préférez « Modifier » et décocher « active ».`}>
                  Supprimer
                </ConfirmButton>
              </form>
            </>
          ) : null
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <Card title="Coordonnées">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Courriel</dt>
                <dd className="text-right">{educator.email ? <a href={`mailto:${educator.email}`} className="hover:underline">{educator.email}</a> : "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Téléphone</dt>
                <dd className="text-right">{educator.phone ? <a href={`tel:${educator.phone}`} className="hover:underline">{educator.phone}</a> : "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Compte d&apos;accès</dt>
                <dd className="text-right">{educator.user ? <Badge className="bg-emerald-100 text-emerald-800 ring-emerald-200">{educator.user.email}</Badge> : <span className="text-slate-400">Aucun</span>}</dd>
              </div>
              {educator.qualifications ? (
                <div>
                  <dt className="text-slate-500">Qualifications</dt>
                  <dd className="mt-1 whitespace-pre-line rounded-lg bg-slate-50 p-2 text-slate-700">{educator.qualifications}</dd>
                </div>
              ) : null}
              {educator.notes ? (
                <div>
                  <dt className="text-slate-500">Notes</dt>
                  <dd className="mt-1 whitespace-pre-line rounded-lg bg-slate-50 p-2 text-slate-700">{educator.notes}</dd>
                </div>
              ) : null}
            </dl>
          </Card>

          <Card title="Groupes">
            {educator.groups.length === 0 ? (
              <p className="text-sm text-slate-500">Aucun groupe affecté. {admin ? <Link href="/groupes" className="text-brand underline">Gérer les groupes</Link> : null}</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {educator.groups.map((ge) => (
                  <li key={ge.groupId} className="flex items-center justify-between">
                    <Link href={`/groupes/${ge.groupId}`} className="flex items-center gap-2 font-medium hover:underline">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ge.group.color }} />
                      {ge.group.name}
                    </Link>
                    {ge.isLead ? <Badge className="bg-brand/10 text-brand-dark ring-brand/20">Référente</Badge> : null}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Card title={`Horaire hebdomadaire · ${weeklyHours.toFixed(1).replace(".0", "")} h / semaine`}>
            {educator.shifts.length === 0 ? (
              <p className="text-sm text-slate-500">Aucun horaire défini.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                {WEEKDAYS.map((d) => {
                  const s = educator.shifts.find((x) => x.weekday === d.value);
                  return (
                    <div key={d.value} className={`rounded-lg border p-2 text-center text-xs ${s ? "border-teal-200 bg-teal-50 text-teal-900" : "border-slate-100 bg-slate-50 text-slate-400"}`}>
                      <p className="font-semibold">{d.short}</p>
                      <p className="mt-1 tabular-nums">{s ? `${s.startTime}–${s.endTime}` : "Repos"}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card title="Congés et absences">
            {educator.leaves.length === 0 ? (
              <p className="mb-4 text-sm text-slate-500">Aucun congé enregistré.</p>
            ) : (
              <ul className="mb-5 divide-y divide-slate-100 text-sm">
                {educator.leaves.map((l) => {
                  const current = l.startDate <= today && l.endDate >= today;
                  return (
                    <li key={l.id} className="flex items-center justify-between gap-3 py-2">
                      <div>
                        <span className="font-medium text-slate-800">
                          {formatDateShort(l.startDate)}
                          {l.endDate !== l.startDate ? ` → ${formatDateShort(l.endDate)}` : ""}
                        </span>
                        <Badge className={`ml-2 ${current ? "bg-amber-100 text-amber-800 ring-amber-200" : "bg-slate-100 text-slate-600 ring-slate-200"}`}>
                          {LEAVE_TYPES[l.type as LeaveType] ?? l.type}
                        </Badge>
                        {l.note ? <span className="ml-2 text-slate-500">{l.note}</span> : null}
                      </div>
                      {admin ? (
                        <form action={deleteLeave}>
                          <input type="hidden" name="id" value={l.id} />
                          <ConfirmButton className="btn-ghost text-xs" message="Supprimer ce congé ?">Retirer</ConfirmButton>
                        </form>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
            {admin ? (
              <>
                <h3 className="mb-2 text-sm font-semibold text-slate-800">Ajouter un congé</h3>
                <LeaveForm educatorId={educator.id} today={today} />
              </>
            ) : null}
          </Card>

          <Card title="Pointage (30 derniers jours)" actions={<Link href="/educatrices/pointage" className="text-xs text-brand hover:underline">Pointer aujourd&apos;hui</Link>}>
            {educator.attendances.length === 0 ? (
              <p className="text-sm text-slate-500">Aucun pointage récent.</p>
            ) : (
              <ul className="max-h-60 space-y-1 overflow-y-auto text-sm">
                {educator.attendances.map((a) => (
                  <li key={a.id} className="flex items-center justify-between rounded px-1 py-1 hover:bg-slate-50">
                    <span className="text-slate-600">{formatDateMedium(a.date)}</span>
                    <span className="flex items-center gap-2">
                      {a.arrivalTime ? <span className="text-xs tabular-nums text-slate-400">{a.arrivalTime}{a.departureTime ? `–${a.departureTime}` : ""}</span> : null}
                      <Badge className={a.status === "PRESENT" ? "bg-emerald-100 text-emerald-800 ring-emerald-200" : a.status === "RETARD" ? "bg-amber-100 text-amber-800 ring-amber-200" : "bg-rose-100 text-rose-800 ring-rose-200"}>
                        {a.status === "PRESENT" ? "Présente" : a.status === "RETARD" ? "En retard" : "Absente"}
                      </Badge>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
