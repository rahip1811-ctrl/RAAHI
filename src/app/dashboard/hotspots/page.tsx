"use client";

import { useEffect, useState } from "react";
import DashHeader from "@/components/DashHeader";
import { Card } from "@/components/ui";

type Hotspot = { name: string; count: number; score: number };

function risk(score: number): { label: string; color: string; bg: string } {
  if (score >= 7) return { label: "Critical", color: "var(--danger)", bg: "var(--danger-soft)" };
  if (score >= 4) return { label: "High", color: "var(--caution)", bg: "var(--caution-soft)" };
  return { label: "Moderate", color: "var(--clear)", bg: "var(--clear-soft)" };
}

export default function HotspotsPage() {
  const [hotspots, setHotspots] = useState<Hotspot[] | null>(null);

  useEffect(() => {
    fetch("/api/dashboard").then((r) => r.json()).then((d) => setHotspots(d.hotspots ?? [])).catch(() => setHotspots([]));
  }, []);

  const max = Math.max(1, ...(hotspots?.map((h) => h.score) ?? [1]));

  return (
    <main className="px-6 py-7 lg:px-8">
      <DashHeader title="Worst hotspots" subtitle="Clusters ranked by density × severity — computed in PostGIS with ST_ClusterDBSCAN." />

      <Card className="p-3">
        {!hotspots && <p className="p-4 text-sm" style={{ color: "var(--text-faint)" }}>Loading…</p>}
        {hotspots && hotspots.length === 0 && (
          <p className="p-4 text-sm" style={{ color: "var(--text-muted)" }}>
            No clusters yet — hotspots appear once several hazards are reported close together.
          </p>
        )}
        <div className="divide-y" style={{ borderColor: "var(--border)" }}>
          {hotspots?.map((h, i) => {
            const r = risk(h.score);
            return (
              <div key={i} className="flex items-center gap-4 p-4">
                <span className="font-display flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold" style={{ background: "var(--brand-soft)", color: "var(--brand-strong)" }}>
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-semibold">{h.name}</span>
                    <span className="r-chip" style={{ color: r.color, background: r.bg }}>{r.label}</span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full" style={{ background: "var(--surface-2)" }}>
                    <div className="h-full rounded-full" style={{ width: `${(h.score / max) * 100}%`, background: r.color }} />
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{h.count}</div>
                  <div className="text-xs" style={{ color: "var(--text-faint)" }}>hazards</div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </main>
  );
}
