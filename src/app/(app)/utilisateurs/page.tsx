import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { requireRole, ROLE_LABELS, type Role } from "@/lib/auth";
import { Alert, Badge, PageHeader } from "@/components/ui";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { deleteUser } from "./actions";

export const metadata: Metadata = { title: "Utilisateurs" };

const ROLE_COLORS: Record<Role, string> = {
  ADMIN: "bg-violet-100 text-violet-800 ring-violet-200",
  EDUCATRICE: "bg-teal-100 text-teal-800 ring-teal-200",
  PARENT: "bg-sky-100 text-sky-800 ring-sky-200",
};

export default async function UsersPage(props: PageProps<"/utilisateurs">) {
  const me = await requireRole("ADMIN");
  const sp = await props.searchParams;
  const users = await prisma.user.findMany({
    include: { educator: { select: { firstName: true, lastName: true } } },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  return (
    <>
      <PageHeader
        title="Utilisateurs"
        subtitle="Comptes ayant accès à l'application et leurs rôles."
        actions={<Link href="/utilisateurs/nouveau" className="btn-primary">Nouveau compte</Link>}
      />
      {sp.erreur === "soi-meme" ? <div className="mb-4"><Alert>Vous ne pouvez pas supprimer votre propre compte.</Alert></div> : null}
      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Courriel</th>
              <th>Rôle</th>
              <th>Éducatrice liée</th>
              <th>Statut</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td className="font-medium text-slate-900">
                  {u.name}
                  {u.id === me.id ? <span className="ml-2 text-xs text-slate-400">(vous)</span> : null}
                </td>
                <td className="text-slate-600">{u.email}</td>
                <td><Badge className={ROLE_COLORS[u.role as Role]}>{ROLE_LABELS[u.role as Role]}</Badge></td>
                <td className="text-slate-600">{u.educator ? `${u.educator.firstName} ${u.educator.lastName}` : "—"}</td>
                <td>{u.active ? <Badge className="bg-emerald-100 text-emerald-800 ring-emerald-200">Actif</Badge> : <Badge>Désactivé</Badge>}</td>
                <td>
                  <div className="flex justify-end gap-1">
                    <Link href={`/utilisateurs/${u.id}`} className="btn-ghost text-xs">Modifier</Link>
                    {u.id !== me.id ? (
                      <form action={deleteUser}>
                        <input type="hidden" name="id" value={u.id} />
                        <ConfirmButton className="btn-ghost text-xs text-rose-600" message={`Supprimer le compte de ${u.name} ?`}>Supprimer</ConfirmButton>
                      </form>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-slate-400">
        Rôles : <strong>Administration</strong> accède à tout ; <strong>Éducatrice</strong> gère les présences, les enfants et l&apos;emploi du temps ;
        <strong> Parent</strong> est réservé à un futur espace parents.
      </p>
    </>
  );
}
