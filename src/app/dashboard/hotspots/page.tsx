"use client";

import { useEffect, useState } from "react";
import DashHeader from "@/components/DashHeader";
import { IconAlert, IconLayers, IconTrend } from "@/components/icons";

type Hotspot = { name: string; count: number; score: number };

function risk(score: number) {
  if (score >= 8) return { label: "Critical", color: "var(--danger)", soft: "var(--danger-soft)" };
  if (score >= 5) return { label: "High", color: "var(--caution)", soft: "var(--caution-soft)" };
  return { label: "Medium", color: "var(--clear)", soft: "var(--clear-soft)" };
}

function Summary({ label, value, icon, color }: { label: string; value: React.ReactNode; icon: React.ReactNode; color: string }) {
  return (
    <div className="lift rounded-2xl border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{label}</span>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `${color}1f`, color }}>{icon}</span>
      </div>
      <div className="font-display mt-2 text-3xl font-extrabold stat-pop" style={{ color }}>{value}</div>
    </div>
  );
}

export default function HotspotsPage() {
  const [hotspots, setHotspots] = useState<Hotspot[] | null>(null);

  useEffect(() => {
    fetch("/api/dashboard").then((r) => r.json()).then((d) => setHotspots(d.hotspots ?? [])).catch(() => setHotspots([]));
  }, []);

  const max = Math.max(1, ...(hotspots?.map((h) => h.score) ?? [1]));
  const critical = (hotspots ?? []).filter((h) => h.score >= 8).length;
  const clustered = (hotspots ?? []).reduce((a, b) => a + b.count, 0);

  return (
    <main className="relative px-6 py-7 lg:px-8">
      <span className="page-glow" style={{ top: -120, right: -60 }} />
      <div className="relative">
        <DashHeader title="Worst hotspots" subtitle="Clusters ranked by density × severity — computed in PostGIS with ST_ClusterDBSCAN." />

        <div className="mb-6 grid grid-cols-3 gap-3">
          <Summary label="Active clusters" value={hotspots?.length ?? "—"} icon={<IconLayers size={17} />} color="var(--brand-strong)" />
          <Summary label="Critical zones" value={hotspots ? critical : "—"} icon={<IconAlert size={17} />} color="#ef4444" />
          <Summary label="Hazards clustered" value={hotspots ? clustered : "—"} icon={<IconTrend size={17} />} color="#6366f1" />
        </div>

        <div className="overflow-hidden rounded-2xl border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="grid grid-cols-[60px_1.6fr_1fr_0.8fr_1.4fr] gap-3 border-b px-5 py-3 text-xs font-bold uppercase tracking-wide" style={{ borderColor: "var(--border)", color: "var(--text-faint)" }}>
            <span>Rank</span><span>Location</span><span>Severity</span><span>Hazards</span><span>Score</span>
          </div>
          {!hotspots && <p className="p-5 text-sm" style={{ color: "var(--text-faint)" }}>Loading…</p>}
          {hotspots && hotspots.length === 0 && <p className="p-5 text-sm" style={{ color: "var(--text-muted)" }}>No clusters yet.</p>}
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {hotspots?.map((h, i) => {
              const r = risk(h.score);
              return (
                <div key={i} className="grid grid-cols-[60px_1.6fr_1fr_0.8fr_1.4fr] items-center gap-3 px-5 py-3.5 transition-colors hover:bg-[var(--surface-2)]">
                  <span className="font-display flex h-7 w-7 items-center justify-center rounded-lg text-sm font-bold" style={{ background: "var(--brand-soft)", color: "var(--brand-strong)" }}>{i + 1}</span>
                  <div className="min-w-0"><div className="truncate font-semibold">{h.name}</div><div className="text-xs" style={{ color: "var(--text-faint)" }}>Ahmedabad</div></div>
                  <span><span className="r-chip" style={{ color: r.color, background: r.soft }}><span className="h-1.5 w-1.5 rounded-full" style={{ background: r.color }} /> {r.label}</span></span>
                  <span className="font-semibold">{h.count}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full" style={{ background: "var(--surface-2)" }}>
                      <div className="h-full rounded-full grad-brand" style={{ width: `${(h.score / max) * 100}%` }} />
                    </div>
                    <span className="w-8 text-right text-sm font-semibold" style={{ color: "var(--text-muted)" }}>{h.score}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
