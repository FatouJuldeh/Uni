import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { Card, PageHeader } from "@/components/ui";
import { UserForm } from "../user-form";
import { createUser } from "../actions";

export const metadata: Metadata = { title: "Nouveau compte" };

export default async function NewUserPage() {
  await requireRole("ADMIN");
  const educators = await prisma.educator.findMany({ where: { active: true, user: null }, orderBy: { lastName: "asc" } });
  return (
    <>
      <PageHeader title="Nouveau compte" />
      <Card className="max-w-3xl">
        <UserForm action={createUser} educators={educators} />
      </Card>
    </>
  );
}
