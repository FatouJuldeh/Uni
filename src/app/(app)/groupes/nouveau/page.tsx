import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { Card, PageHeader } from "@/components/ui";
import { GroupForm } from "../group-form";
import { createGroup } from "../actions";

export const metadata: Metadata = { title: "Nouveau groupe" };

export default async function NewGroupPage() {
  await requireRole("ADMIN");
  const educators = await prisma.educator.findMany({ where: { active: true }, orderBy: { lastName: "asc" } });
  return (
    <>
      <PageHeader title="Nouveau groupe" />
      <Card className="max-w-3xl">
        <GroupForm action={createGroup} educators={educators} cancelHref="/groupes" />
      </Card>
    </>
  );
}
