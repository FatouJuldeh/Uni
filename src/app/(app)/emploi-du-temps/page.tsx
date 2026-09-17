import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { requireUser, isAdmin } from "@/lib/auth";
import { WEEKDAYS, timeToMinutes } from "@/lib/dates";
import { SLOT_CATEGORIES, type SlotCategory } from "@/lib/labels";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { SlotForm } from "./slot-form";
import { copySchedule, createSlot } from "./actions";

export const metadata: Metadata = { title: "Emploi du temps" };

export default async function SchedulePage(props: PageProps<"/emploi-du-temps">) {
  const user = await requireUser();
  const sp = await props.searchParams;
  const groups = await prisma.group.findMany({ orderBy: { name: "asc" } });
  const groupId = typeof sp.groupe === "string" && groups.some((g) => g.id === sp.groupe) ? sp.groupe : groups[0]?.id ?? "";
  const group = groups.find((g) => g.id === groupId);

  if (!group) {
    return (
      <>
        <PageHeader title="Emploi du temps" />
        <EmptyState
          title="Créez d'abord un groupe"
          description="L'emploi du temps est défini par groupe d'enfants."
          action={isAdmin(user) ? <Link href="/groupes/nouveau" className="btn-primary">Créer un groupe</Link> : null}
        />
      </>
    );
  }

  const [slots, educators] = await Promise.all([
    prisma.scheduleSlot.findMany({
      where: { groupId },
      include: { educator: true },
      orderBy: [{ weekday: "asc" }, { startTime: "asc" }],
    }),
    prisma.educator.findMany({ where: { active: true }, orderBy: { lastName: "asc" } }),
  ]);

  const hasWeekend = slots.some((s) => s.weekday >= 6);
  const days = hasWeekend ? WEEKDAYS : WEEKDAYS.slice(0, 5);

  // Bornes de la grille horaire
  const minStart = Math.min(7 * 60, ...slots.map((s) => timeToMinutes(s.startTime)));
  const maxEnd = Math.max(18 * 60, ...slots.map((s) => timeToMinutes(s.endTime)));
  const startHour = Math.floor(minStart / 60);
  const endHour = Math.ceil(maxEnd / 60);
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  const PX_PER_HOUR = 56;
  const gridHeight = hours.length * PX_PER_HOUR;
  const top = (t: string) => ((timeToMinutes(t) - startHour * 60) / 60) * PX_PER_HOUR;

  return (
    <>
      <PageHeader
        title="Emploi du temps"
        subtitle="Planning hebdomadaire des activités, repas et siestes par groupe."
        actions={<Link href={`/emploi-du-temps/imprimer?groupe=${groupId}`} className="btn-secondary" target="_blank">Version imprimable</Link>}
      />

      <nav className="mb-4 flex flex-wrap gap-1" aria-label="Groupes">
        {groups.map((g) => (
          <Link
            key={g.id}
            href={`/emploi-du-temps?groupe=${g.id}`}
            className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${groupId === g.id ? "text-white" : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"}`}
            style={groupId === g.id ? { backgroundColor: g.color } : undefined}
          >
            {g.name}
          </Link>
        ))}
      </nav>

      {slots.length === 0 ? (
        <EmptyState title={`Aucun créneau pour « ${group.name} »`} description="Ajoutez les activités de la semaine avec le formulaire ci-dessous." />
      ) : (
        <div className="card overflow-x-auto">
          <div className="min-w-[720px]">
            <div className="grid border-b border-slate-200" style={{ gridTemplateColumns: `56px repeat(${days.length}, minmax(0, 1fr))` }}>
              <div />
              {days.map((d) => (
                <div key={d.value} className="border-l border-slate-100 px-2 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {d.label}
                </div>
              ))}
            </div>
            <div className="relative grid" style={{ gridTemplateColumns: `56px repeat(${days.length}, minmax(0, 1fr))`, height: gridHeight }}>
              {/* Colonne des heures */}
              <div className="relative">
                {hours.map((h, i) => (
                  <div key={h} className="absolute right-2 -translate-y-1/2 text-[11px] tabular-nums text-slate-400" style={{ top: i * PX_PER_HOUR }}>
                    {String(h).padStart(2, "0")}:00
                  </div>
                ))}
              </div>
              {days.map((d) => (
                <div key={d.value} className="relative border-l border-slate-100">
                  {hours.map((h, i) => (
                    <div key={h} className="absolute inset-x-0 border-t border-dashed border-slate-100" style={{ top: i * PX_PER_HOUR }} />
                  ))}
                  {slots
                    .filter((s) => s.weekday === d.value)
                    .map((s) => {
                      const cat = SLOT_CATEGORIES[s.category as SlotCategory] ?? SLOT_CATEGORIES.AUTRE;
                      const height = Math.max(22, top(s.endTime) - top(s.startTime));
                      return (
                        <Link
                          key={s.id}
                          href={`/emploi-du-temps/creneau/${s.id}`}
                          className={`absolute inset-x-1 overflow-hidden rounded-md border-l-4 px-1.5 py-1 text-[11px] leading-tight shadow-sm transition hover:z-10 hover:shadow-md ${cat.color}`}
                          style={{ top: top(s.startTime), height }}
                          title={`${s.title} · ${s.startTime}–${s.endTime}${s.educator ? ` · ${s.educator.firstName}` : ""}`}
                        >
                          <span className="block truncate font-semibold">{s.title}</span>
                          {height > 34 ? <span className="block truncate opacity-80">{s.startTime}–{s.endTime}{s.location ? ` · ${s.location}` : ""}</span> : null}
                          {height > 48 && s.educator ? <span className="block truncate opacity-80">{s.educator.firstName} {s.educator.lastName}</span> : null}
                        </Link>
                      );
                    })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        {Object.entries(SLOT_CATEGORIES).map(([k, v]) => (
          <span key={k} className={`rounded-md border-l-4 px-2 py-0.5 ${v.color}`}>{v.label}</span>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card title={`Ajouter un créneau · ${group.name}`} className="lg:col-span-2">
          <SlotForm key={groupId} action={createSlot} groupId={groupId} groups={groups} educators={educators} />
        </Card>
        {isAdmin(user) && groups.length > 1 ? (
          <Card title="Copier un emploi du temps">
            <form action={copySchedule} className="space-y-3">
              <input type="hidden" name="toGroupId" value={groupId} />
              <p className="text-sm text-slate-500">Copier tous les créneaux d&apos;un autre groupe vers « {group.name} ».</p>
              <select name="fromGroupId" className="input" required defaultValue="">
                <option value="" disabled>Choisir le groupe source</option>
                {groups.filter((g) => g.id !== groupId).map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
              <button type="submit" className="btn-secondary w-full">Copier</button>
            </form>
          </Card>
        ) : null}
      </div>
    </>
  );
}
