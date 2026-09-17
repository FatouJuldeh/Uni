import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatAge } from "@/lib/dates";
import { Avatar, Badge, EmptyState, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Enfants" };

export default async function ChildrenPage(props: PageProps<"/enfants">) {
  await requireUser();
  const sp = await props.searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const groupId = typeof sp.groupe === "string" ? sp.groupe : "";
  const showInactive = sp.inactifs === "1";

  const [groups, children] = await Promise.all([
    prisma.group.findMany({ orderBy: { name: "asc" } }),
    prisma.child.findMany({
      where: {
        ...(showInactive ? {} : { active: true }),
        ...(groupId ? { groupId } : {}),
        ...(q
          ? { OR: [{ firstName: { contains: q } }, { lastName: { contains: q } }] }
          : {}),
      },
      include: { group: true, guardians: { where: { isPrimary: true }, take: 1 } },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Enfants"
        subtitle={`${children.length} enfant${children.length > 1 ? "s" : ""} affiché${children.length > 1 ? "s" : ""}`}
        actions={<Link href="/enfants/nouveau" className="btn-primary">Inscrire un enfant</Link>}
      />

      <form className="card mb-4 flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-48 flex-1">
          <label htmlFor="q" className="label">Recherche</label>
          <input id="q" name="q" defaultValue={q} placeholder="Prénom ou nom" className="input" />
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
        <label className="flex items-center gap-2 pb-2 text-sm text-slate-700">
          <input type="checkbox" name="inactifs" value="1" defaultChecked={showInactive} className="h-4 w-4 accent-teal-600" />
          Inclure les anciens
        </label>
        <button type="submit" className="btn-secondary">Filtrer</button>
      </form>

      {children.length === 0 ? (
        <EmptyState
          title="Aucun enfant trouvé"
          description="Modifiez les filtres ou inscrivez un nouvel enfant."
          action={<Link href="/enfants/nouveau" className="btn-primary">Inscrire un enfant</Link>}
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Enfant</th>
                <th>Âge</th>
                <th>Groupe</th>
                <th>Contact principal</th>
                <th>Allergies</th>
              </tr>
            </thead>
            <tbody>
              {children.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link href={`/enfants/${c.id}`} className="flex items-center gap-3">
                      <Avatar name={`${c.firstName} ${c.lastName}`} color={c.group?.color} />
                      <span className="font-medium text-slate-900">
                        {c.firstName} {c.lastName}
                        {!c.active ? <Badge className="ml-2 bg-slate-100 text-slate-500 ring-slate-200">Parti</Badge> : null}
                      </span>
                    </Link>
                  </td>
                  <td className="text-slate-600">{formatAge(c.birthDate)}</td>
                  <td className="text-slate-600">{c.group?.name ?? <span className="text-slate-400">—</span>}</td>
                  <td className="text-slate-600">
                    {c.guardians[0] ? (
                      <>
                        {c.guardians[0].name}
                        {c.guardians[0].phone ? <span className="block text-xs text-slate-400">{c.guardians[0].phone}</span> : null}
                      </>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td>{c.allergies ? <Badge className="bg-rose-100 text-rose-800 ring-rose-200">{c.allergies}</Badge> : <span className="text-slate-400">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
