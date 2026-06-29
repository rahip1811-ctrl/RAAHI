"use client";

import { useEffect, useState } from "react";
import DashHeader from "@/components/DashHeader";
import { IconAlert, IconCheck, IconUsers, IconTrend } from "@/components/icons";

type Leader = { id: string; name: string; reports: number; resolved: number; confirmations: number; lastActive: string | null; impact: number; level: string };

const LEVEL_COLOR: Record<string, string> = {
  "City Protector": "#8b5cf6", "Road Guardian": "var(--brand-strong)", "Hazard Hunter": "#3b82f6", Reporter: "#f59e0b", Newcomer: "var(--text-faint)",
};
function ago(iso: string | null) {
  if (!iso) return "—";
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 60) return `${Math.max(1, m)} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
const medal = ["#f5c518", "#9aa7b5", "#cd7f32"];

function Podium({ l, i }: { l: Leader; i: number }) {
  return (
    <div className="lift rounded-2xl border p-5 text-center" style={{ background: "var(--surface)", borderColor: i === 0 ? "var(--brand)" : "var(--border)", boxShadow: i === 0 ? "var(--shadow-lg)" : "var(--shadow-sm)" }}>
      <div className="relative mx-auto h-16 w-16">
        <span className="flex h-16 w-16 items-center justify-center rounded-full text-2xl font-extrabold" style={{ background: "var(--brand)", color: "var(--brand-ink)" }}>{l.name.charAt(0).toUpperCase()}</span>
        <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: medal[i] }}>{i + 1}</span>
      </div>
      <div className="mt-3 font-bold">{l.name}</div>
      <div className="text-xs font-semibold" style={{ color: LEVEL_COLOR[l.level] }}>{l.level}</div>
      <div className="font-display mt-2 text-2xl font-extrabold stat-pop" style={{ color: "var(--brand-strong)" }}>{l.impact}</div>
      <div className="text-xs" style={{ color: "var(--text-faint)" }}>Impact score</div>
      <div className="mt-3 flex justify-center gap-4 border-t pt-3 text-xs" style={{ borderColor: "var(--border)" }}>
        <span><span className="font-bold" style={{ color: "var(--text)" }}>{l.reports}</span> <span style={{ color: "var(--text-faint)" }}>reports</span></span>
        <span><span className="font-bold" style={{ color: "var(--text)" }}>{l.resolved}</span> <span style={{ color: "var(--text-faint)" }}>resolved</span></span>
        <span><span className="font-bold" style={{ color: "var(--text)" }}>{l.confirmations}</span> <span style={{ color: "var(--text-faint)" }}>conf.</span></span>
      </div>
    </div>
  );
}

function Impact({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: React.ReactNode; color: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
      <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${color}1f`, color }}>{icon}</span>
      <div><div className="font-display text-lg font-extrabold stat-pop">{value}</div><div className="text-xs" style={{ color: "var(--text-faint)" }}>{label}</div></div>
    </div>
  );
}

export default function UsersPage() {
  const [leaders, setLeaders] = useState<Leader[] | null>(null);
  useEffect(() => { fetch("/api/leaderboard").then((r) => r.json()).then((d) => setLeaders(d.leaders ?? [])).catch(() => setLeaders([])); }, []);

  const top3 = (leaders ?? []).slice(0, 3);
  const totalReports = (leaders ?? []).reduce((a, b) => a + b.reports, 0);
  const totalConfirmed = (leaders ?? []).reduce((a, b) => a + b.confirmations, 0);
  const totalResolved = (leaders ?? []).reduce((a, b) => a + b.resolved, 0);

  return (
    <main className="relative px-6 py-7 lg:px-8">
      <span className="page-glow" style={{ top: -120, right: 100 }} />
      <div className="relative">
        <DashHeader title="Community Contributors" subtitle="The drivers reporting hazards and making our roads safer." />

        {/* podium */}
        <div className="mb-5 grid gap-4 sm:grid-cols-3">
          {!leaders && <p className="text-sm" style={{ color: "var(--text-faint)" }}>Loading…</p>}
          {top3.map((l, i) => <Podium key={l.id} l={l} i={i} />)}
          {leaders && top3.length === 0 && <p className="text-sm" style={{ color: "var(--text-muted)" }}>No contributors yet.</p>}
        </div>

        {/* impact created */}
        <div className="mb-5 rounded-2xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <h2 className="mb-3 font-semibold">Impact created by the community</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <Impact icon={<IconAlert size={18} />} label="Hazards reported" value={totalReports} color="#ef4444" />
            <Impact icon={<IconCheck size={18} />} label="Community confirmations" value={totalConfirmed} color="var(--brand-strong)" />
            <Impact icon={<IconTrend size={18} />} label="Hazards resolved" value={totalResolved} color="#3b82f6" />
          </div>
        </div>

        {/* all contributors table */}
        <div className="overflow-hidden rounded-2xl border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2 border-b px-5 py-3 font-semibold" style={{ borderColor: "var(--border)" }}><IconUsers size={18} /> All contributors</div>
          <div className="grid grid-cols-[44px_1.5fr_0.7fr_0.7fr_0.7fr_0.7fr_0.9fr] gap-3 border-b px-5 py-2.5 text-xs font-bold uppercase tracking-wide" style={{ borderColor: "var(--border)", color: "var(--text-faint)" }}>
            <span>Rank</span><span>Driver</span><span>Reports</span><span>Resolved</span><span>Confirmed</span><span>Impact</span><span>Last active</span>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {leaders?.map((l, i) => (
              <div key={l.id} className="grid grid-cols-[44px_1.5fr_0.7fr_0.7fr_0.7fr_0.7fr_0.9fr] items-center gap-3 px-5 py-3 text-sm transition-colors hover:bg-[var(--surface-2)]">
                <span className="font-display font-extrabold" style={{ color: i < 3 ? medal[i] : "var(--text-muted)" }}>{i + 1}</span>
                <span className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold" style={{ background: "var(--brand)", color: "var(--brand-ink)" }}>{l.name.charAt(0).toUpperCase()}</span>
                  <span className="min-w-0"><span className="block truncate font-semibold">{l.name}</span><span className="block text-xs" style={{ color: LEVEL_COLOR[l.level] }}>{l.level}</span></span>
                </span>
                <span style={{ color: "var(--text-muted)" }}>{l.reports}</span>
                <span style={{ color: "var(--text-muted)" }}>{l.resolved}</span>
                <span style={{ color: "var(--text-muted)" }}>{l.confirmations}</span>
                <span className="font-semibold" style={{ color: "var(--brand-strong)" }}>{l.impact}</span>
                <span className="text-xs" style={{ color: "var(--text-faint)" }}>{ago(l.lastActive)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
