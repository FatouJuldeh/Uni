import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { Card, PageHeader } from "@/components/ui";
import { EducatorForm } from "../educator-form";
import { createEducator } from "../actions";

export const metadata: Metadata = { title: "Nouvelle éducatrice" };

export default async function NewEducatorPage() {
  await requireRole("ADMIN");
  return (
    <>
      <PageHeader title="Ajouter une éducatrice" />
      <Card className="max-w-3xl">
        <EducatorForm action={createEducator} cancelHref="/educatrices" />
      </Card>
    </>
  );
}
