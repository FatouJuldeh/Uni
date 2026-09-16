import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { weekdayLabel } from "@/lib/dates";
import { Card, PageHeader } from "@/components/ui";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { SlotForm } from "../../slot-form";
import { deleteSlot, updateSlot } from "../../actions";

export default async function EditSlotPage(props: PageProps<"/emploi-du-temps/creneau/[id]">) {
  await requireUser();
  const { id } = await props.params;
  const [slot, groups, educators] = await Promise.all([
    prisma.scheduleSlot.findUnique({ where: { id } }),
    prisma.group.findMany({ orderBy: { name: "asc" } }),
    prisma.educator.findMany({ where: { active: true }, orderBy: { lastName: "asc" } }),
  ]);
  if (!slot) notFound();
  return (
    <>
      <PageHeader
        title={`Modifier « ${slot.title} »`}
        subtitle={`${weekdayLabel(slot.weekday)} ${slot.startTime}–${slot.endTime}`}
        actions={
          <form action={deleteSlot}>
            <input type="hidden" name="id" value={slot.id} />
            <ConfirmButton message="Supprimer ce créneau ?">Supprimer</ConfirmButton>
          </form>
        }
      />
      <Card className="max-w-3xl">
        <SlotForm
          mode="edit"
          action={updateSlot.bind(null, id)}
          groupId={slot.groupId}
          groups={groups}
          educators={educators}
          initial={slot}
          cancelHref={`/emploi-du-temps?groupe=${slot.groupId}`}
        />
      </Card>
    </>
  );
}
