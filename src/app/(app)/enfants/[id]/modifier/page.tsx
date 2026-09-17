import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { Card, PageHeader } from "@/components/ui";
import { ChildForm } from "../../child-form";
import { updateChild } from "../../actions";

export default async function EditChildPage(props: PageProps<"/enfants/[id]/modifier">) {
  await requireRole("ADMIN", "EDUCATRICE");
  const { id } = await props.params;
  const [child, groups] = await Promise.all([
    prisma.child.findUnique({ where: { id } }),
    prisma.group.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!child) notFound();
  return (
    <>
      <PageHeader title={`Modifier ${child.firstName} ${child.lastName}`} />
      <Card className="max-w-3xl">
        <ChildForm action={updateChild.bind(null, id)} groups={groups} cancelHref={`/enfants/${id}`} initial={child} />
      </Card>
    </>
  );
}
