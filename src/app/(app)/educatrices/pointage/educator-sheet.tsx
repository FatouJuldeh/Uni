"use client";

import { useFormAction } from "@/lib/use-form-action";
import { useState } from "react";
import Link from "next/link";
import { Alert } from "@/components/ui";
import { saveEducatorAttendance } from "../actions";

type Status = "PRESENT" | "RETARD" | "ABSENT" | "";
export type EducatorRow = {
  id: string;
  name: string;
  position: string;
  shift: string | null;
  onLeave: boolean;
  status: Status;
  arrival: string;
  departure: string;
  note: string;
};

const LABELS: Record<Exclude<Status, "">, { label: string; color: string }> = {
  PRESENT: { label: "Présente", color: "bg-emerald-100 text-emerald-800 ring-emerald-200" },
  RETARD: { label: "En retard", color: "bg-amber-100 text-amber-800 ring-amber-200" },
  ABSENT: { label: "Absente", color: "bg-rose-100 text-rose-800 ring-rose-200" },
};

export function EducatorSheet({ date, rows: initial, nowTime }: { date: string; rows: EducatorRow[]; nowTime: string }) {
  const { state, pending, onSubmit } = useFormAction(saveEducatorAttendance);
  const [rows, setRows] = useState(initial);
  const update = (id: string, patch: Partial<EducatorRow>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  if (rows.length === 0) {
    return <div className="card p-8 text-center text-sm text-slate-500">Aucune éducatrice active.</div>;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="date" value={date} />
      {state?.error ? <Alert>{state.error}</Alert> : null}
      {state?.success ? <Alert kind="success">{state.success}</Alert> : null}
      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Éducatrice</th>
              <th>Horaire prévu</th>
              <th>Statut</th>
              <th className="w-28">Arrivée</th>
              <th className="w-28">Départ</th>
              <th>Remarque</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <Link href={`/educatrices/${r.id}`} className="font-medium text-slate-900 hover:underline">{r.name}</Link>
                  <span className="block text-xs text-slate-400">{r.position}</span>
                </td>
                <td className="text-sm text-slate-600">
                  {r.onLeave ? <span className="text-amber-700">En congé</span> : r.shift ?? <span className="text-slate-400">Repos</span>}
                </td>
                <td>
                  <input type="hidden" name={`status-${r.id}`} value={r.status} />
                  <div className="flex flex-wrap gap-1">
                    {(Object.keys(LABELS) as Exclude<Status, "">[]).map((s) => {
                      const active = r.status === s;
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => update(r.id, { status: active ? "" : s, arrival: !active && s !== "ABSENT" && !r.arrival ? nowTime : r.arrival })}
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition ${active ? LABELS[s].color + " ring-2" : "bg-white text-slate-500 ring-slate-200 hover:bg-slate-50"}`}
                        >
                          {LABELS[s].label}
                        </button>
                      );
                    })}
                  </div>
                </td>
                <td><input type="time" name={`arrival-${r.id}`} value={r.arrival} onChange={(e) => update(r.id, { arrival: e.target.value })} disabled={r.status === "ABSENT" || !r.status} className="input px-2 py-1 text-xs" /></td>
                <td><input type="time" name={`departure-${r.id}`} value={r.departure} onChange={(e) => update(r.id, { departure: e.target.value })} disabled={r.status === "ABSENT" || !r.status} className="input px-2 py-1 text-xs" /></td>
                <td><input name={`note-${r.id}`} value={r.note} onChange={(e) => update(r.id, { note: e.target.value })} className="input px-2 py-1 text-xs" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end">
        <button type="submit" className="btn-primary" disabled={pending}>{pending ? "Enregistrement…" : "Enregistrer le pointage"}</button>
      </div>
    </form>
  );
}
