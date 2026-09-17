import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { Card, PageHeader } from "@/components/ui";
import { GroupForm } from "../../group-form";
import { updateGroup } from "../../actions";

export default async function EditGroupPage(props: PageProps<"/groupes/[id]/modifier">) {
  await requireRole("ADMIN");
  const { id } = await props.params;
  const [group, educators] = await Promise.all([
    prisma.group.findUnique({ where: { id }, include: { educators: true } }),
    prisma.educator.findMany({ where: { active: true }, orderBy: { lastName: "asc" } }),
  ]);
  if (!group) notFound();
  const action = updateGroup.bind(null, id);
  return (
    <>
      <PageHeader title={`Modifier « ${group.name} »`} />
      <Card className="max-w-3xl">
        <GroupForm
          action={action}
          educators={educators}
          cancelHref={`/groupes/${id}`}
          initial={{
            name: group.name,
            ageMin: group.ageMin,
            ageMax: group.ageMax,
            color: group.color,
            room: group.room,
            capacity: group.capacity,
            educatorIds: group.educators.map((e) => e.educatorId),
            leadId: group.educators.find((e) => e.isLead)?.educatorId ?? null,
          }}
        />
      </Card>
    </>
  );
}
