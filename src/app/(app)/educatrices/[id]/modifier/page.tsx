import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { Card, PageHeader } from "@/components/ui";
import { EducatorForm } from "../../educator-form";
import { updateEducator } from "../../actions";

export default async function EditEducatorPage(props: PageProps<"/educatrices/[id]/modifier">) {
  await requireRole("ADMIN");
  const { id } = await props.params;
  const educator = await prisma.educator.findUnique({ where: { id }, include: { shifts: true } });
  if (!educator) notFound();
  return (
    <>
      <PageHeader title={`Modifier ${educator.firstName} ${educator.lastName}`} />
      <Card className="max-w-3xl">
        <EducatorForm action={updateEducator.bind(null, id)} cancelHref={`/educatrices/${id}`} initial={educator} />
      </Card>
    </>
  );
}
