import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRole, type Role } from "@/lib/auth";
import { Card, PageHeader } from "@/components/ui";
import { UserForm } from "../user-form";
import { updateUser } from "../actions";

export default async function EditUserPage(props: PageProps<"/utilisateurs/[id]">) {
  const me = await requireRole("ADMIN");
  const { id } = await props.params;
  const [user, educators] = await Promise.all([
    prisma.user.findUnique({ where: { id } }),
    prisma.educator.findMany({
      where: { active: true, OR: [{ user: null }, { user: { id } }] },
      orderBy: { lastName: "asc" },
    }),
  ]);
  if (!user) notFound();
  return (
    <>
      <PageHeader title={`Modifier le compte de ${user.name}`} />
      <Card className="max-w-3xl">
        <UserForm
          action={updateUser.bind(null, id)}
          educators={educators}
          isSelf={user.id === me.id}
          initial={{ name: user.name, email: user.email, role: user.role as Role, educatorId: user.educatorId, active: user.active }}
        />
      </Card>
    </>
  );
}
