import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { requireUser, isAdmin } from "@/lib/auth";
import { EmptyState, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Groupes" };

export default async function GroupsPage() {
  const user = await requireUser();
  const groups = await prisma.group.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { children: { where: { active: true } } } },
      educators: { include: { educator: true }, orderBy: { isLead: "desc" } },
    },
  });

  return (
    <>
      <PageHeader
        title="Groupes"
        subtitle="Groupes d'âge, salles et éducatrices affectées."
        actions={isAdmin(user) ? <Link href="/groupes/nouveau" className="btn-primary">Nouveau groupe</Link> : null}
      />
      {groups.length === 0 ? (
        <EmptyState
          title="Aucun groupe pour l'instant"
          description="Créez un premier groupe (ex. Poupons, Bambins, Préscolaires) pour y inscrire des enfants."
          action={isAdmin(user) ? <Link href="/groupes/nouveau" className="btn-primary">Créer un groupe</Link> : null}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <Link key={g.id} href={`/groupes/${g.id}`} className="card p-5 transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: g.color }} />
                  <h2 className="font-semibold text-slate-900">{g.name}</h2>
                </div>
                <span className="text-sm text-slate-500">
                  {g._count.children}
                  {g.capacity ? `/${g.capacity}` : ""} enfant{g._count.children > 1 ? "s" : ""}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {g.ageMin != null || g.ageMax != null
                  ? `${g.ageMin ?? 0} à ${g.ageMax ?? "…"} mois`
                  : "Tous âges"}
                {g.room ? ` · ${g.room}` : ""}
              </p>
              <div className="mt-3 flex flex-wrap gap-1">
                {g.educators.length === 0 ? (
                  <span className="text-xs text-slate-400">Aucune éducatrice affectée</span>
                ) : (
                  g.educators.map((ge) => (
                    <span key={ge.educatorId} className={`rounded-full px-2 py-0.5 text-xs ${ge.isLead ? "bg-brand/10 text-brand-dark font-medium" : "bg-slate-100 text-slate-600"}`}>
                      {ge.educator.firstName} {ge.educator.lastName}
                      {ge.isLead ? " ★" : ""}
                    </span>
                  ))
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
