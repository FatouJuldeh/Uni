import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { WEEKDAYS } from "@/lib/dates";
import { SLOT_CATEGORIES, type SlotCategory } from "@/lib/labels";

export const metadata: Metadata = { title: "Emploi du temps (impression)" };

export default async function PrintSchedulePage(props: PageProps<"/emploi-du-temps/imprimer">) {
  await requireUser();
  const sp = await props.searchParams;
  const groupId = typeof sp.groupe === "string" ? sp.groupe : "";
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { slots: { include: { educator: true }, orderBy: [{ weekday: "asc" }, { startTime: "asc" }] } },
  });
  if (!group) notFound();
  const days = group.slots.some((s) => s.weekday >= 6) ? WEEKDAYS : WEEKDAYS.slice(0, 5);

  return (
    <div className="bg-white p-6 text-slate-900 print:p-0">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <p className="text-sm text-slate-500">Utilisez Ctrl+P / Cmd+P pour imprimer.</p>
        <a href={`/emploi-du-temps?groupe=${group.id}`} className="btn-secondary">Retour</a>
      </div>
      <h1 className="text-xl font-semibold">Emploi du temps · {group.name}</h1>
      <table className="mt-4 w-full border-collapse text-xs">
        <thead>
          <tr>
            {days.map((d) => (
              <th key={d.value} className="border border-slate-300 bg-slate-100 px-2 py-1 text-left">{d.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="align-top">
            {days.map((d) => (
              <td key={d.value} className="w-1/5 border border-slate-300 p-1">
                <ul className="space-y-1">
                  {group.slots.filter((s) => s.weekday === d.value).map((s) => {
                    const cat = SLOT_CATEGORIES[s.category as SlotCategory] ?? SLOT_CATEGORIES.AUTRE;
                    return (
                      <li key={s.id} className={`rounded border-l-4 px-1.5 py-1 ${cat.color}`}>
                        <span className="font-semibold">{s.startTime}–{s.endTime}</span> {s.title}
                        {s.location ? <span className="block opacity-80">{s.location}</span> : null}
                        {s.educator ? <span className="block opacity-80">{s.educator.firstName} {s.educator.lastName}</span> : null}
                      </li>
                    );
                  })}
                </ul>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
