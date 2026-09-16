import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser, isAdmin } from "@/lib/auth";
import { formatAge, todayISO } from "@/lib/dates";
import { Card, PageHeader, Badge } from "@/components/ui";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { deleteGroup } from "../actions";

export default async function GroupDetailPage(props: PageProps<"/groupes/[id]">) {
  const user = await requireUser();
  const { id } = await props.params;
  const group = await prisma.group.findUnique({
    where: { id },
    include: {
      children: { where: { active: true }, orderBy: [{ lastName: "asc" }, { firstName: "asc" }] },
      educators: { include: { educator: true }, orderBy: { isLead: "desc" } },
    },
  });
  if (!group) notFound();
  const today = todayISO();

  return (
    <>
      <PageHeader
        title={group.name}
        subtitle={
          <>
            {group.ageMin != null || group.ageMax != null ? `${group.ageMin ?? 0} à ${group.ageMax ?? "…"} mois` : "Tous âges"}
            {group.room ? ` · ${group.room}` : ""}
            {group.capacity ? ` · capacité ${group.capacity}` : ""}
          </>
        }
        actions={
          <>
            <Link href={`/presences?date=${today}&groupe=${group.id}`} className="btn-secondary">Présences</Link>
            <Link href={`/emploi-du-temps?groupe=${group.id}`} className="btn-secondary">Emploi du temps</Link>
            {isAdmin(user) ? (
              <>
                <Link href={`/groupes/${group.id}/modifier`} className="btn-primary">Modifier</Link>
                <form action={deleteGroup}>
                  <input type="hidden" name="id" value={group.id} />
                  <ConfirmButton message={`Supprimer le groupe « ${group.name} » ? Les enfants resteront inscrits mais sans groupe.`}>
                    Supprimer
                  </ConfirmButton>
                </form>
              </>
            ) : null}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Éducatrices" className="lg:col-span-1">
          {group.educators.length === 0 ? (
            <p className="text-sm text-slate-500">Aucune éducatrice affectée.</p>
          ) : (
            <ul className="space-y-2">
              {group.educators.map((ge) => (
                <li key={ge.educatorId} className="flex items-center justify-between text-sm">
                  <Link href={`/educatrices/${ge.educatorId}`} className="font-medium text-slate-800 hover:underline">
                    {ge.educator.firstName} {ge.educator.lastName}
                  </Link>
                  {ge.isLead ? <Badge className="bg-brand/10 text-brand-dark ring-brand/20">Référente</Badge> : null}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title={`Enfants (${group.children.length})`} className="lg:col-span-2">
          {group.children.length === 0 ? (
            <p className="text-sm text-slate-500">
              Aucun enfant dans ce groupe. <Link href="/enfants/nouveau" className="text-brand underline">Inscrire un enfant</Link>
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Âge</th>
                    <th>Allergies</th>
                  </tr>
                </thead>
                <tbody>
                  {group.children.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <Link href={`/enfants/${c.id}`} className="font-medium text-slate-800 hover:underline">
                          {c.firstName} {c.lastName}
                        </Link>
                      </td>
                      <td className="text-slate-600">{formatAge(c.birthDate)}</td>
                      <td className="text-slate-600">{c.allergies ? <Badge className="bg-rose-100 text-rose-800 ring-rose-200">{c.allergies}</Badge> : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
