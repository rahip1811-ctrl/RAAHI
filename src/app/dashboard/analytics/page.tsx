"use client";

import { useEffect, useState } from "react";
import DashHeader from "@/components/DashHeader";
import Donut from "@/components/Donut";

type Analytics = {
  totals: { active: number; resolved: number; high: number; medium: number; low: number; allTime: number; resolutionRate: number; mostCommon: string | null };
  byType: { type: string; count: number }[];
  severity: { label: string; value: number }[];
  overTime: { day: string; reports: number; resolved: number }[];
};

const typeLabel = (t: string) => (t === "pothole" ? "Pothole" : t === "debris" ? "Debris" : "Construction");
const TYPE_COLORS: Record<string, string> = { pothole: "#ef4444", debris: "#f59e0b", construction: "#6366f1" };

function LineChart({ data }: { data: { day: string; reports: number; resolved: number }[] }) {
  const W = 600, H = 200, P = 28;
  if (data.length === 0) return <p className="py-10 text-center text-sm" style={{ color: "var(--text-faint)" }}>No time-series data yet.</p>;
  const max = Math.max(1, ...data.map((d) => Math.max(d.reports, d.resolved)));
  const x = (i: number) => P + (i * (W - 2 * P)) / Math.max(1, data.length - 1);
  const y = (v: number) => H - P - (v / max) * (H - 2 * P);
  const path = (key: "reports" | "resolved") =>
    data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(d[key])}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {[0, 0.5, 1].map((f, i) => (<line key={i} x1={P} x2={W - P} y1={P + f * (H - 2 * P)} y2={P + f * (H - 2 * P)} stroke="var(--border)" strokeWidth="1" />))}
      <path d={path("reports")} fill="none" stroke="var(--brand)" strokeWidth="2.5" />
      <path d={path("resolved")} fill="none" stroke="#3b82f6" strokeWidth="2.5" />
      {data.map((d, i) => (<g key={i}><circle cx={x(i)} cy={y(d.reports)} r="3" fill="var(--brand)" /><circle cx={x(i)} cy={y(d.resolved)} r="3" fill="#3b82f6" /></g>))}
      {data.map((d, i) => (<text key={i} x={x(i)} y={H - 8} fontSize="9" textAnchor="middle" fill="var(--text-faint)">{d.day}</text>))}
    </svg>
  );
}

function Mini({ label, value, color }: { label: string; value: React.ReactNode; color: string }) {
  return (
    <div className="rounded-2xl border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</div>
      <div className="font-display mt-1 text-2xl font-extrabold stat-pop" style={{ color }}>{value}</div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [a, setA] = useState<Analytics | null>(null);
  useEffect(() => { fetch("/api/analytics").then((r) => r.json()).then(setA).catch(() => {}); }, []);

  const t = a?.totals;
  return (
    <main className="relative px-6 py-7 lg:px-8">
      <span className="page-glow" style={{ top: -100, left: 200 }} />
      <div className="relative">
        <DashHeader title="Analytics" subtitle="Distribution of what's on the roads right now." />

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Mini label="Total reports" value={t?.allTime ?? "—"} color="var(--text)" />
          <Mini label="Most common" value={t?.mostCommon ? typeLabel(t.mostCommon) : "—"} color="var(--danger)" />
          <Mini label="High severity" value={t?.high ?? "—"} color="var(--danger)" />
          <Mini label="Resolution rate" value={t ? `${t.resolutionRate}%` : "—"} color="var(--clear)" />
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="card-accent rounded-2xl border p-6" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <h2 className="mb-4 font-semibold">Reports by type</h2>
            {a && <Donut centerValue={a.byType.reduce((x, y) => x + y.count, 0)} centerLabel="active" data={a.byType.map((x) => ({ label: typeLabel(x.type), value: x.count, color: TYPE_COLORS[x.type] ?? "var(--text-faint)" }))} />}
          </div>
          <div className="card-accent rounded-2xl border p-6" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <h2 className="mb-4 font-semibold">Severity split</h2>
            {a && <Donut centerValue={(t?.active ?? 0)} centerLabel="active" data={a.severity.map((x) => ({ label: x.label, value: x.value, color: x.label === "High" ? "var(--danger)" : x.label === "Medium" ? "var(--caution)" : "var(--clear)" }))} />}
          </div>
          <div className="rounded-2xl border p-6 lg:col-span-1" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <h2 className="mb-4 font-semibold">Reports over time</h2>
            <div className="mb-2 flex gap-4 text-xs" style={{ color: "var(--text-muted)" }}>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: "var(--brand)" }} /> Reported</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: "#3b82f6" }} /> Resolved</span>
            </div>
            {a && <LineChart data={a.overTime} />}
          </div>
        </div>
      </div>
    </main>
  );
}
