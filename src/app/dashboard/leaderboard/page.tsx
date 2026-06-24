"use client";

import { useEffect, useState } from "react";
import DashHeader from "@/components/DashHeader";
import DashboardMap from "@/components/DashboardMap";
import { IconAlert, IconCheck, IconUsers, IconTrend, IconLayers } from "@/components/icons";

type Dash = { stats: { total: number; high: number; resolved: number; allTime: number; resolutionRate: number }; hotspots: { score: number }[] };
type Zone = { name: string; reported: number; resolved: number; rate: number; score: number };
type Leader = { id: string; name: string; reports: number; resolved: number; impact: number };
type Over = { day: string; reports: number; resolved: number };

function StatCard({ label, value, icon, color }: { label: string; value: React.ReactNode; icon: React.ReactNode; color: string }) {
  return (
    <div className="lift rounded-2xl border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}>
      <div className="flex items-center justify-between"><span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{label}</span><span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `${color}1f`, color }}>{icon}</span></div>
      <div className="font-display mt-2 text-2xl font-extrabold stat-pop" style={{ color }}>{value}</div>
    </div>
  );
}

function LineChart({ data }: { data: Over[] }) {
  const W = 600, H = 200, P = 26;
  if (data.length === 0) return <p className="py-10 text-center text-sm" style={{ color: "var(--text-faint)" }}>No time-series data yet.</p>;
  const max = Math.max(1, ...data.map((d) => Math.max(d.reports, d.resolved)));
  const x = (i: number) => P + (i * (W - 2 * P)) / Math.max(1, data.length - 1);
  const y = (v: number) => H - P - (v / max) * (H - 2 * P);
  const path = (k: "reports" | "resolved") => data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(d[k])}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {[0, 0.5, 1].map((f, i) => (<line key={i} x1={P} x2={W - P} y1={P + f * (H - 2 * P)} y2={P + f * (H - 2 * P)} stroke="var(--border)" />))}
      <path d={path("reports")} fill="none" stroke="var(--brand)" strokeWidth="2.5" />
      <path d={path("resolved")} fill="none" stroke="#3b82f6" strokeWidth="2.5" />
      {data.map((d, i) => (<text key={i} x={x(i)} y={H - 6} fontSize="9" textAnchor="middle" fill="var(--text-faint)">{d.day}</text>))}
    </svg>
  );
}

export default function LeadershipPage() {
  const [dash, setDash] = useState<Dash | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [over, setOver] = useState<Over[]>([]);
  const [zLoaded, setZLoaded] = useState(false);
  const [lLoaded, setLLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard").then((r) => r.json()).then(setDash).catch(() => {});
    fetch("/api/zones").then((r) => r.json()).then((d) => setZones(d.zones ?? [])).catch(() => {}).finally(() => setZLoaded(true));
    fetch("/api/leaderboard").then((r) => r.json()).then((d) => setLeaders(d.leaders ?? [])).catch(() => {}).finally(() => setLLoaded(true));
    fetch("/api/analytics").then((r) => r.json()).then((d) => setOver(d.overTime ?? [])).catch(() => {});
  }, []);

  const s = dash?.stats;
  const critical = (dash?.hotspots ?? []).filter((h) => h.score >= 8).length;
  const maxZone = Math.max(1, ...zones.map((z) => z.score));
  const maxImpact = Math.max(1, ...leaders.map((l) => l.impact));

  return (
    <main className="relative px-6 py-7 lg:px-8">
      <span className="page-glow" style={{ top: -140, right: 60 }} />
      <div className="relative">
        <DashHeader title="Leadership Board" subtitle="Citywide performance at a glance." />

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatCard label="Total hazards" value={s?.allTime ?? "—"} icon={<IconLayers size={16} />} color="var(--brand-strong)" />
          <StatCard label="High severity" value={s?.high ?? "—"} icon={<IconAlert size={16} />} color="#ef4444" />
          <StatCard label="Active contributors" value={leaders.length || "—"} icon={<IconUsers size={16} />} color="#8b5cf6" />
          <StatCard label="Hazards resolved" value={s?.resolved ?? "—"} icon={<IconCheck size={16} />} color="#3b82f6" />
          <StatCard label="Resolution rate" value={s ? `${s.resolutionRate}%` : "—"} icon={<IconTrend size={16} />} color="var(--clear)" />
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">City performance overview</h2></div>
            <div className="mb-3 grid grid-cols-3 gap-2 text-center text-xs">
              <div><div className="font-display text-lg font-extrabold">{dash?.hotspots.length ?? "—"}</div><div style={{ color: "var(--text-faint)" }}>Active clusters</div></div>
              <div><div className="font-display text-lg font-extrabold" style={{ color: "var(--danger)" }}>{dash ? critical : "—"}</div><div style={{ color: "var(--text-faint)" }}>Critical zones</div></div>
              <div><div className="font-display text-lg font-extrabold" style={{ color: "var(--clear)" }}>{s ? `${s.resolutionRate}%` : "—"}</div><div style={{ color: "var(--text-faint)" }}>Resolution</div></div>
            </div>
            <div className="mb-2 flex gap-4 text-xs" style={{ color: "var(--text-muted)" }}>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: "var(--brand)" }} /> Reported</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: "#3b82f6" }} /> Resolved</span>
            </div>
            <LineChart data={over} />
          </div>
          <div className="overflow-hidden rounded-2xl border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="border-b p-4 font-semibold" style={{ borderColor: "var(--border)" }}>Hazard density map</div>
            <div className="h-[260px]"><DashboardMap /></div>
          </div>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          {/* zones */}
          <div className="overflow-hidden rounded-2xl border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="border-b p-4 font-semibold" style={{ borderColor: "var(--border)" }}>Zone leaderboard</div>
            <div className="grid grid-cols-[40px_1.4fr_0.8fr_0.8fr_1.2fr] gap-2 border-b px-4 py-2 text-[0.65rem] font-bold uppercase" style={{ borderColor: "var(--border)", color: "var(--text-faint)" }}>
              <span>#</span><span>Zone</span><span>Reported</span><span>Resolved</span><span>Score</span>
            </div>
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {!zLoaded && <p className="p-4 text-sm" style={{ color: "var(--text-faint)" }}>Loading…</p>}
              {zLoaded && zones.length === 0 && <p className="p-4 text-sm" style={{ color: "var(--text-muted)" }}>No zones yet.</p>}
              {zones.map((z, i) => (
                <div key={i} className="grid grid-cols-[40px_1.4fr_0.8fr_0.8fr_1.2fr] items-center gap-2 px-4 py-2.5 text-sm">
                  <span className="font-bold" style={{ color: "var(--text-muted)" }}>{i + 1}</span>
                  <span className="truncate font-medium">{z.name}</span>
                  <span style={{ color: "var(--text-muted)" }}>{z.reported}</span>
                  <span style={{ color: "var(--text-muted)" }}>{z.resolved}</span>
                  <div className="h-2 overflow-hidden rounded-full" style={{ background: "var(--surface-2)" }}><div className="h-full rounded-full grad-brand" style={{ width: `${(z.score / maxZone) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          </div>
          {/* contributors */}
          <div className="overflow-hidden rounded-2xl border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="border-b p-4 font-semibold" style={{ borderColor: "var(--border)" }}>Top contributors</div>
            <div className="grid grid-cols-[40px_1.4fr_0.8fr_0.8fr_1.2fr] gap-2 border-b px-4 py-2 text-[0.65rem] font-bold uppercase" style={{ borderColor: "var(--border)", color: "var(--text-faint)" }}>
              <span>#</span><span>Driver</span><span>Reports</span><span>Resolved</span><span>Impact</span>
            </div>
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {!lLoaded && <p className="p-4 text-sm" style={{ color: "var(--text-faint)" }}>Loading…</p>}
              {lLoaded && leaders.length === 0 && <p className="p-4 text-sm" style={{ color: "var(--text-muted)" }}>No contributors yet — report a hazard to appear here.</p>}
              {leaders.slice(0, 6).map((l, i) => (
                <div key={l.id} className="grid grid-cols-[40px_1.4fr_0.8fr_0.8fr_1.2fr] items-center gap-2 px-4 py-2.5 text-sm">
                  <span className="font-bold" style={{ color: "var(--text-muted)" }}>{i + 1}</span>
                  <span className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold" style={{ background: "var(--brand)", color: "var(--brand-ink)" }}>{l.name.charAt(0).toUpperCase()}</span><span className="truncate font-medium">{l.name}</span></span>
                  <span style={{ color: "var(--text-muted)" }}>{l.reports}</span>
                  <span style={{ color: "var(--text-muted)" }}>{l.resolved}</span>
                  <div className="flex items-center gap-2"><div className="h-2 flex-1 overflow-hidden rounded-full" style={{ background: "var(--surface-2)" }}><div className="h-full rounded-full grad-brand" style={{ width: `${(l.impact / maxImpact) * 100}%` }} /></div><span className="font-semibold" style={{ color: "var(--brand-strong)" }}>{l.impact}</span></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
