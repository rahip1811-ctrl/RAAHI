"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DashHeader from "@/components/DashHeader";
import { IconAlert, IconLayers, IconTrend, IconPin } from "@/components/icons";

type Zone = { name: string; reported: number; resolved: number; rate: number; score: number; lat: number; lng: number };

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

const COLS = "grid-cols-[48px_1.4fr_1fr_0.7fr_0.9fr_1.2fr_84px]";

export default function HotspotsPage() {
  const [zones, setZones] = useState<Zone[] | null>(null);

  useEffect(() => {
    fetch("/api/zones").then((r) => r.json()).then((d) => setZones(d.zones ?? [])).catch(() => setZones([]));
  }, []);

  const max = Math.max(1, ...(zones?.map((z) => z.score) ?? [1]));
  const critical = (zones ?? []).filter((z) => z.score >= 8).length;
  const clustered = (zones ?? []).reduce((a, b) => a + b.reported, 0);
  const resolvedTotal = (zones ?? []).reduce((a, b) => a + b.resolved, 0);

  return (
    <main className="relative px-6 py-7 lg:px-8">
      <span className="page-glow" style={{ top: -120, right: -60 }} />
      <div className="relative">
        <DashHeader title="Worst hotspots" subtitle="Every hazard grouped into zones in PostGIS with ST_ClusterDBSCAN, ranked by density × severity." />

        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Summary label="Active zones" value={zones?.length ?? "—"} icon={<IconLayers size={17} />} color="var(--brand-strong)" />
          <Summary label="Critical zones" value={zones ? critical : "—"} icon={<IconAlert size={17} />} color="#ef4444" />
          <Summary label="Hazards clustered" value={zones ? clustered : "—"} icon={<IconTrend size={17} />} color="#6366f1" />
          <Summary label="Resolved in zones" value={zones ? resolvedTotal : "—"} icon={<IconPin size={17} />} color="var(--clear)" />
        </div>

        <div className="overflow-hidden rounded-2xl border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className={`grid ${COLS} gap-3 border-b px-5 py-3 text-xs font-bold uppercase tracking-wide`} style={{ borderColor: "var(--border)", color: "var(--text-faint)" }}>
            <span>Rank</span><span>Location</span><span>Severity</span><span>Hazards</span><span>Resolved</span><span>Score</span><span>Map</span>
          </div>
          {!zones && <p className="p-5 text-sm" style={{ color: "var(--text-faint)" }}>Loading…</p>}
          {zones && zones.length === 0 && <p className="p-5 text-sm" style={{ color: "var(--text-muted)" }}>No zones yet.</p>}
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {zones?.map((z, i) => {
              const r = risk(z.score);
              return (
                <div key={i} className={`grid ${COLS} items-center gap-3 px-5 py-3.5 transition-colors hover:bg-[var(--surface-2)]`}>
                  <span className="font-display flex h-7 w-7 items-center justify-center rounded-lg text-sm font-bold" style={{ background: "var(--brand-soft)", color: "var(--brand-strong)" }}>{i + 1}</span>
                  <div className="min-w-0"><div className="truncate font-semibold">{z.name}</div><div className="text-xs" style={{ color: "var(--text-faint)" }}>Ahmedabad</div></div>
                  <span><span className="r-chip" style={{ color: r.color, background: r.soft }}><span className="h-1.5 w-1.5 rounded-full" style={{ background: r.color }} /> {r.label}</span></span>
                  <span className="font-semibold">{z.reported}</span>
                  <span className="text-sm" style={{ color: "var(--text-muted)" }}>{z.resolved} <span style={{ color: "var(--text-faint)" }}>· {z.rate}%</span></span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full" style={{ background: "var(--surface-2)" }}>
                      <div className="h-full rounded-full grad-brand" style={{ width: `${(z.score / max) * 100}%` }} />
                    </div>
                    <span className="w-6 text-right text-sm font-semibold" style={{ color: "var(--text-muted)" }}>{z.score}</span>
                  </div>
                  <Link href={`/dashboard/map?lat=${z.lat}&lng=${z.lng}&label=${encodeURIComponent(z.name)}`} className="btn-press flex items-center justify-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-semibold" style={{ borderColor: "var(--border)", color: "var(--brand-strong)" }}><IconPin size={13} /> View</Link>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
