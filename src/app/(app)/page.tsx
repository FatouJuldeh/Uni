import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDateLong, isoWeekday, todayISO, timeToMinutes, nowTimeHHMM } from "@/lib/dates";
import { ATTENDANCE_STATUS, SLOT_CATEGORIES, type AttendanceStatus, type SlotCategory } from "@/lib/labels";
import { Alert, Badge, Card, PageHeader, StatCard } from "@/components/ui";

export default async function DashboardPage(props: PageProps<"/">) {
  const user = await requireUser();
  const sp = await props.searchParams;
  const today = todayISO();
  const weekday = isoWeekday(today);

  const [childrenCount, groups, attendances, educators, leaves, slots] = await Promise.all([
    prisma.child.count({ where: { active: true } }),
    prisma.group.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { children: { where: { active: true } } } } },
    }),
    prisma.attendance.findMany({ where: { date: today }, include: { child: { select: { groupId: true } } } }),
    prisma.educator.findMany({ where: { active: true }, include: { shifts: { where: { weekday } } } }),
    prisma.leave.findMany({
      where: { startDate: { lte: today }, endDate: { gte: today } },
      include: { educator: true },
    }),
    prisma.scheduleSlot.findMany({
      where: { weekday },
      include: { group: true },
      orderBy: [{ startTime: "asc" }],
    }),
  ]);

  const counts = { PRESENT: 0, RETARD: 0, ABSENT: 0, EXCUSE: 0 } as Record<AttendanceStatus, number>;
  for (const a of attendances) counts[a.status as AttendanceStatus] += 1;
  const present = counts.PRESENT + counts.RETARD;
  const notRecorded = childrenCount - attendances.length;

  const onLeaveIds = new Set(leaves.map((l) => l.educatorId));
  const onDuty = educators.filter((e) => e.shifts.length > 0 && !onLeaveIds.has(e.id));

  const now = timeToMinutes(nowTimeHHMM());
  const upcoming = slots.filter((s) => timeToMinutes(s.endTime) >= now).slice(0, 8);

  const byGroup = new Map<string, { present: number; total: number }>();
  for (const g of groups) byGroup.set(g.id, { present: 0, total: g._count.children });
  for (const a of attendances) {
    if (a.child.groupId && (a.status === "PRESENT" || a.status === "RETARD")) {
      const entry = byGroup.get(a.child.groupId);
      if (entry) entry.present += 1;
    }
  }

  return (
    <>
      <PageHeader
        title={`Bonjour ${user.name.split(" ")[0]} 👋`}
        subtitle={formatDateLong(today)}
        actions={
          <Link href={`/presences?date=${today}`} className="btn-primary">
            Prendre les présences
          </Link>
        }
      />

      {sp.erreur === "acces-refuse" ? (
        <div className="mb-6">
          <Alert>Vous n&apos;avez pas accès à cette section.</Alert>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Enfants inscrits" value={childrenCount} href="/enfants" />
        <StatCard
          label="Présents aujourd'hui"
          value={present}
          hint={notRecorded > 0 ? `${notRecorded} sans pointage` : "Tous pointés"}
          tone="good"
          href={`/presences?date=${today}`}
        />
        <StatCard
          label="Absents"
          value={counts.ABSENT + counts.EXCUSE}
          hint={counts.RETARD > 0 ? `${counts.RETARD} en retard` : undefined}
          tone={counts.ABSENT > 0 ? "bad" : "default"}
          href={`/presences?date=${today}`}
        />
        <StatCard
          label="Éducatrices en service"
          value={onDuty.length}
          hint={leaves.length > 0 ? `${leaves.length} en congé` : undefined}
          href="/educatrices"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card title="Présences par groupe" className="lg:col-span-1">
          {groups.length === 0 ? (
            <p className="text-sm text-slate-500">
              Aucun groupe. <Link href="/groupes/nouveau" className="text-brand underline">Créer un groupe</Link>
            </p>
          ) : (
            <ul className="space-y-3">
              {groups.map((g) => {
                const c = byGroup.get(g.id)!;
                const pct = c.total ? Math.round((c.present / c.total) * 100) : 0;
                return (
                  <li key={g.id}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <Link href={`/presences?date=${today}&groupe=${g.id}`} className="flex items-center gap-2 font-medium text-slate-800 hover:underline">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: g.color }} />
                        {g.name}
                      </Link>
                      <span className="text-slate-500">
                        {c.present}/{c.total}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: g.color }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card title="Programme du jour" className="lg:col-span-1" actions={<Link href="/emploi-du-temps" className="text-xs text-brand hover:underline">Voir tout</Link>}>
          {upcoming.length === 0 ? (
            <p className="text-sm text-slate-500">Aucune activité restante aujourd&apos;hui.</p>
          ) : (
            <ul className="space-y-2">
              {upcoming.map((s) => {
                const cat = SLOT_CATEGORIES[s.category as SlotCategory] ?? SLOT_CATEGORIES.AUTRE;
                return (
                  <li key={s.id} className={`rounded-lg border px-3 py-2 text-sm ${cat.color}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{s.title}</span>
                      <span className="text-xs tabular-nums">
                        {s.startTime}–{s.endTime}
                      </span>
                    </div>
                    <p className="text-xs opacity-80">{s.group.name}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card title="Équipe du jour" className="lg:col-span-1" actions={<Link href="/educatrices" className="text-xs text-brand hover:underline">Gérer</Link>}>
          {educators.length === 0 ? (
            <p className="text-sm text-slate-500">Aucune éducatrice enregistrée.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {educators.map((e) => {
                const leave = leaves.find((l) => l.educatorId === e.id);
                const shift = e.shifts[0];
                return (
                  <li key={e.id} className="flex items-center justify-between py-2 text-sm">
                    <Link href={`/educatrices/${e.id}`} className="font-medium text-slate-800 hover:underline">
                      {e.firstName} {e.lastName}
                    </Link>
                    {leave ? (
                      <Badge className="bg-amber-100 text-amber-800 ring-amber-200">En congé</Badge>
                    ) : shift ? (
                      <span className="text-xs tabular-nums text-slate-500">
                        {shift.startTime}–{shift.endTime}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Repos</span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      {attendances.length > 0 ? (
        <div className="mt-6 flex flex-wrap gap-2 text-xs text-slate-500">
          {(Object.keys(ATTENDANCE_STATUS) as AttendanceStatus[]).map((k) => (
            <Badge key={k} className={ATTENDANCE_STATUS[k].color}>
              {ATTENDANCE_STATUS[k].label} : {counts[k]}
            </Badge>
          ))}
        </div>
      ) : null}
    </>
  );
}
