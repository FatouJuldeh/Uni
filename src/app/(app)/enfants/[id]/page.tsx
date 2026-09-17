import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser, isAdmin } from "@/lib/auth";
import { formatAge, formatDateShort, formatDateMedium, addDays, todayISO } from "@/lib/dates";
import { ATTENDANCE_STATUS, GENDERS, type AttendanceStatus } from "@/lib/labels";
import { Badge, Card, PageHeader } from "@/components/ui";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { GuardianForm } from "../guardian-form";
import { deleteChild, deleteGuardian } from "../actions";

export default async function ChildDetailPage(props: PageProps<"/enfants/[id]">) {
  const user = await requireUser();
  const { id } = await props.params;
  const since = addDays(todayISO(), -30);
  const child = await prisma.child.findUnique({
    where: { id },
    include: {
      group: true,
      guardians: { orderBy: [{ isPrimary: "desc" }, { name: "asc" }] },
      attendances: { where: { date: { gte: since } }, orderBy: { date: "desc" } },
    },
  });
  if (!child) notFound();

  const stats = child.attendances.reduce(
    (acc, a) => {
      acc[a.status as AttendanceStatus] = (acc[a.status as AttendanceStatus] ?? 0) + 1;
      return acc;
    },
    {} as Partial<Record<AttendanceStatus, number>>,
  );

  return (
    <>
      <PageHeader
        title={`${child.firstName} ${child.lastName}`}
        subtitle={
          <>
            {formatAge(child.birthDate)} · né{child.gender === "F" ? "e" : ""} le {formatDateShort(child.birthDate)}
            {child.gender ? ` · ${GENDERS[child.gender as keyof typeof GENDERS]}` : ""}
            {!child.active ? " · n'est plus inscrit" : ""}
          </>
        }
        actions={
          <>
            <Link href={`/enfants/${child.id}/modifier`} className="btn-primary">Modifier</Link>
            {isAdmin(user) ? (
              <form action={deleteChild}>
                <input type="hidden" name="id" value={child.id} />
                <ConfirmButton message={`Supprimer définitivement le dossier de ${child.firstName} ${child.lastName} ? L'historique de présence sera perdu. Pour un départ, préférez « Modifier » puis décocher « inscrit ».`}>
                  Supprimer
                </ConfirmButton>
              </form>
            ) : null}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <Card title="Informations">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Groupe</dt>
                <dd className="text-right font-medium">
                  {child.group ? (
                    <Link href={`/groupes/${child.group.id}`} className="hover:underline">{child.group.name}</Link>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Date d&apos;entrée</dt>
                <dd className="text-right font-medium">{child.startDate ? formatDateShort(child.startDate) : "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Allergies</dt>
                <dd className="text-right font-medium">
                  {child.allergies ? <Badge className="bg-rose-100 text-rose-800 ring-rose-200">{child.allergies}</Badge> : "Aucune"}
                </dd>
              </div>
              {child.medicalNotes ? (
                <div>
                  <dt className="text-slate-500">Informations médicales</dt>
                  <dd className="mt-1 whitespace-pre-line rounded-lg bg-slate-50 p-2 text-slate-700">{child.medicalNotes}</dd>
                </div>
              ) : null}
              {child.notes ? (
                <div>
                  <dt className="text-slate-500">Notes</dt>
                  <dd className="mt-1 whitespace-pre-line rounded-lg bg-slate-50 p-2 text-slate-700">{child.notes}</dd>
                </div>
              ) : null}
            </dl>
          </Card>

          <Card title="Présences (30 derniers jours)">
            <div className="mb-3 flex flex-wrap gap-2">
              {(Object.keys(ATTENDANCE_STATUS) as AttendanceStatus[]).map((k) => (
                <Badge key={k} className={ATTENDANCE_STATUS[k].color}>
                  {ATTENDANCE_STATUS[k].label} : {stats[k] ?? 0}
                </Badge>
              ))}
            </div>
            {child.attendances.length === 0 ? (
              <p className="text-sm text-slate-500">Aucun pointage récent.</p>
            ) : (
              <ul className="max-h-72 space-y-1 overflow-y-auto text-sm">
                {child.attendances.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-2 rounded px-1 py-1 hover:bg-slate-50">
                    <span className="text-slate-600">{formatDateMedium(a.date)}</span>
                    <span className="flex items-center gap-2">
                      {a.arrivalTime ? <span className="text-xs tabular-nums text-slate-400">{a.arrivalTime}{a.departureTime ? `–${a.departureTime}` : ""}</span> : null}
                      <Badge className={ATTENDANCE_STATUS[a.status as AttendanceStatus]?.color}>
                        {ATTENDANCE_STATUS[a.status as AttendanceStatus]?.label ?? a.status}
                      </Badge>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Card title="Parents et contacts">
            {child.guardians.length === 0 ? (
              <p className="mb-4 text-sm text-slate-500">Aucun contact enregistré.</p>
            ) : (
              <ul className="mb-5 divide-y divide-slate-100">
                {child.guardians.map((g) => (
                  <li key={g.id} className="flex items-start justify-between gap-3 py-3">
                    <div>
                      <p className="font-medium text-slate-900">
                        {g.name} <span className="font-normal text-slate-500">· {g.relation}</span>
                        {g.isPrimary ? <Badge className="ml-2 bg-brand/10 text-brand-dark ring-brand/20">Principal</Badge> : null}
                        {!g.canPickUp ? <Badge className="ml-2 bg-rose-100 text-rose-800 ring-rose-200">Ne peut pas venir chercher</Badge> : null}
                      </p>
                      <p className="text-sm text-slate-600">
                        {g.phone ? <a href={`tel:${g.phone}`} className="hover:underline">{g.phone}</a> : null}
                        {g.phone && g.email ? " · " : ""}
                        {g.email ? <a href={`mailto:${g.email}`} className="hover:underline">{g.email}</a> : null}
                      </p>
                    </div>
                    <form action={deleteGuardian}>
                      <input type="hidden" name="id" value={g.id} />
                      <ConfirmButton className="btn-ghost text-xs" message={`Retirer le contact ${g.name} ?`}>Retirer</ConfirmButton>
                    </form>
                  </li>
                ))}
              </ul>
            )}
            <h3 className="mb-2 text-sm font-semibold text-slate-800">Ajouter un contact</h3>
            <GuardianForm childId={child.id} />
          </Card>
        </div>
      </div>
    </>
  );
}
