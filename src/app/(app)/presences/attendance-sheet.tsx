"use client";

import { useFormAction } from "@/lib/use-form-action";
import { useState } from "react";
import Link from "next/link";
import { ATTENDANCE_STATUS, type AttendanceStatus } from "@/lib/labels";
import { Alert } from "@/components/ui";
import { saveAttendanceSheet } from "./actions";

export type SheetRow = {
  id: string;
  name: string;
  groupName: string | null;
  allergies: string | null;
  status: AttendanceStatus | "";
  arrival: string;
  departure: string;
  note: string;
};

const STATUS_ORDER: AttendanceStatus[] = ["PRESENT", "RETARD", "ABSENT", "EXCUSE"];

export function AttendanceSheet({
  date,
  groupId,
  rows: initialRows,
  nowTime,
}: {
  date: string;
  groupId: string;
  rows: SheetRow[];
  nowTime: string;
}) {
  const { state, pending, onSubmit } = useFormAction(saveAttendanceSheet);
  const [rows, setRows] = useState(initialRows);

  const update = (id: string, patch: Partial<SheetRow>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const markAll = (status: AttendanceStatus) =>
    setRows((rs) =>
      rs.map((r) => ({
        ...r,
        status,
        arrival: status === "PRESENT" || status === "RETARD" ? r.arrival || nowTime : r.arrival,
      })),
    );

  const counts = rows.reduce(
    (acc, r) => {
      if (r.status) acc[r.status] = (acc[r.status] ?? 0) + 1;
      else acc.none += 1;
      return acc;
    },
    { none: 0 } as Record<string, number>,
  );

  if (rows.length === 0) {
    return (
      <div className="card p-8 text-center text-sm text-slate-500">
        Aucun enfant actif dans cette sélection.{" "}
        <Link href="/enfants/nouveau" className="text-brand underline">Inscrire un enfant</Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="groupId" value={groupId} />

      {state?.error ? <Alert>{state.error}</Alert> : null}
      {state?.success ? <Alert kind="success">{state.success}</Alert> : null}

      <div className="card flex flex-wrap items-center justify-between gap-3 p-3">
        <div className="flex flex-wrap gap-2 text-xs">
          {STATUS_ORDER.map((s) => (
            <span key={s} className={`rounded-full px-2 py-0.5 ring-1 ring-inset ${ATTENDANCE_STATUS[s].color}`}>
              {ATTENDANCE_STATUS[s].label} : {counts[s] ?? 0}
            </span>
          ))}
          {counts.none > 0 ? (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-500 ring-1 ring-inset ring-slate-200">
              Non pointés : {counts.none}
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secondary text-xs" onClick={() => markAll("PRESENT")}>
            Tous présents
          </button>
          <button type="button" className="btn-secondary text-xs" onClick={() => markAll("ABSENT")}>
            Tous absents
          </button>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Enfant</th>
              <th>Statut</th>
              <th className="w-28">Arrivée</th>
              <th className="w-28">Départ</th>
              <th>Remarque</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const isPresent = r.status === "PRESENT" || r.status === "RETARD";
              return (
                <tr key={r.id}>
                  <td>
                    <Link href={`/enfants/${r.id}`} className="font-medium text-slate-900 hover:underline">
                      {r.name}
                    </Link>
                    {!groupId && r.groupName ? <span className="block text-xs text-slate-400">{r.groupName}</span> : null}
                    {r.allergies ? (
                      <span className="mt-0.5 block text-xs font-medium text-rose-600">⚠ {r.allergies}</span>
                    ) : null}
                  </td>
                  <td>
                    <input type="hidden" name={`status-${r.id}`} value={r.status} />
                    <div className="flex flex-wrap gap-1" role="radiogroup" aria-label={`Statut de ${r.name}`}>
                      {STATUS_ORDER.map((s) => {
                        const active = r.status === s;
                        return (
                          <button
                            key={s}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            onClick={() =>
                              update(r.id, {
                                status: active ? "" : s,
                                arrival:
                                  !active && (s === "PRESENT" || s === "RETARD") && !r.arrival ? nowTime : r.arrival,
                              })
                            }
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition ${
                              active
                                ? ATTENDANCE_STATUS[s].color + " ring-2"
                                : "bg-white text-slate-500 ring-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            {ATTENDANCE_STATUS[s].label}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                  <td>
                    <input
                      type="time"
                      name={`arrival-${r.id}`}
                      value={r.arrival}
                      onChange={(e) => update(r.id, { arrival: e.target.value })}
                      disabled={!isPresent}
                      className="input px-2 py-1 text-xs"
                      aria-label={`Heure d'arrivée de ${r.name}`}
                    />
                  </td>
                  <td>
                    <input
                      type="time"
                      name={`departure-${r.id}`}
                      value={r.departure}
                      onChange={(e) => update(r.id, { departure: e.target.value })}
                      disabled={!isPresent}
                      className="input px-2 py-1 text-xs"
                      aria-label={`Heure de départ de ${r.name}`}
                    />
                  </td>
                  <td>
                    <input
                      name={`note-${r.id}`}
                      value={r.note}
                      onChange={(e) => update(r.id, { note: e.target.value })}
                      placeholder="Fièvre, parent en retard…"
                      className="input px-2 py-1 text-xs"
                      aria-label={`Remarque pour ${r.name}`}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer la feuille"}
        </button>
      </div>
    </form>
  );
}
