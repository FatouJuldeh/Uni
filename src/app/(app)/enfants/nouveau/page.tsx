import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { Card, PageHeader } from "@/components/ui";
import { ChildForm } from "../child-form";
import { createChild } from "../actions";

export const metadata: Metadata = { title: "Inscrire un enfant" };

export default async function NewChildPage() {
  await requireRole("ADMIN", "EDUCATRICE");
  const groups = await prisma.group.findMany({ orderBy: { name: "asc" } });
  return (
    <>
      <PageHeader title="Inscrire un enfant" />
      <Card className="max-w-3xl">
        <ChildForm action={createChild} groups={groups} cancelHref="/enfants" withGuardian />
      </Card>
    </>
  );
}
