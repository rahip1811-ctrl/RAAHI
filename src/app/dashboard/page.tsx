"use client";

import { useEffect, useState } from "react";
import DashboardMap from "@/components/DashboardMap";
import DashHeader from "@/components/DashHeader";
import Donut from "@/components/Donut";
import { Card, StatCard, SeverityChip } from "@/components/ui";
import { IconAlert, IconLayers, IconClock } from "@/components/icons";

type Dash = {
  stats: { total: number; high: number; medium: number; low: number };
  byType: { type: string; count: number }[];
  hotspots: { name: string; count: number; score: number }[];
};

type Hz = { id: string; type: string; severity: string; created_at?: string };

const typeLabel = (t: string) =>
  t === "pothole" ? "Pothole" : t === "debris" ? "Debris" : "Construction";
const TYPE_COLORS: Record<string, string> = {
  pothole: "#ef4444",
  debris: "#f59e0b",
  construction: "#6366f1",
};

function ago(iso?: string) {
  if (!iso) return "";
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3.6e6);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function DashboardOverview() {
  const [data, setData] = useState<Dash | null>(null);
  const [feed, setFeed] = useState<Hz[]>([]);

  useEffect(() => {
    fetch("/api/dashboard").then((r) => r.json()).then(setData).catch(() => {});
    fetch("/api/hazards").then((r) => r.json()).then((d) => setFeed(d.hazards ?? [])).catch(() => {});
  }, []);

  const s = data?.stats;

  return (
    <main className="px-6 py-7 lg:px-8">
      <DashHeader title="Command Center" subtitle="City safety intelligence · Ahmedabad" />

      {/* stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Active hazards" value={s?.total ?? "—"} icon={<IconLayers size={18} />} accent="var(--text)" />
        <StatCard label="High severity" value={s?.high ?? "—"} accent="var(--danger)" />
        <StatCard label="Medium" value={s?.medium ?? "—"} accent="var(--caution)" />
        <StatCard label="Low" value={s?.low ?? "—"} accent="var(--clear)" />
      </div>

      {/* feed + map */}
      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card className="flex flex-col p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Live report feed</h2>
            <span className="r-chip" style={{ color: "var(--clear)", background: "var(--clear-soft)" }}>
              <span className="live-dot" /> Live
            </span>
          </div>
          <div className="thin-scroll max-h-[330px] space-y-2 overflow-y-auto">
            {feed.length === 0 && <p className="text-sm" style={{ color: "var(--text-faint)" }}>No reports yet.</p>}
            {feed.slice(0, 12).map((h) => (
              <div key={h.id} className="flex items-center gap-3 rounded-xl border p-2.5" style={{ borderColor: "var(--border)" }}>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold" style={{ background: "var(--surface-2)", color: TYPE_COLORS[h.type] }}>
                  {typeLabel(h.type).charAt(0)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{typeLabel(h.type)}</div>
                  <div className="flex items-center gap-1 text-xs" style={{ color: "var(--text-faint)" }}>
                    <IconClock size={11} /> {ago(h.created_at)}
                  </div>
                </div>
                <SeverityChip s={h.severity} />
              </div>
            ))}
          </div>
        </Card>

        <Card className="overflow-hidden p-0 lg:col-span-2">
          <div className="flex items-center justify-between border-b p-4" style={{ borderColor: "var(--border)" }}>
            <h2 className="font-semibold">City hazard heatmap</h2>
            <span className="text-xs" style={{ color: "var(--text-faint)" }}>density × severity</span>
          </div>
          <div className="h-[330px]">
            <DashboardMap />
          </div>
        </Card>
      </div>

      {/* hotspots + donuts */}
      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card className="p-5">
          <h2 className="mb-3 flex items-center gap-2 font-semibold">
            <IconAlert size={18} /> Top hotspots
          </h2>
          <div className="space-y-2">
            {!data && <p className="text-sm" style={{ color: "var(--text-faint)" }}>Loading…</p>}
            {data && data.hotspots.length === 0 && (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Hotspots appear once several hazards cluster together.
              </p>
            )}
            {data?.hotspots.slice(0, 6).map((h, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border p-2.5" style={{ borderColor: "var(--border)" }}>
                <span className="font-display flex h-7 w-7 items-center justify-center rounded-lg text-sm font-bold" style={{ background: "var(--brand-soft)", color: "var(--brand-strong)" }}>
                  {i + 1}
                </span>
                <span className="flex-1 truncate text-sm font-medium">{h.name}</span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>{h.count} · {h.score}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 font-semibold">Hazard types</h2>
          {data && (
            <Donut
              centerValue={data.byType.reduce((a, b) => a + b.count, 0)}
              centerLabel="reports"
              data={data.byType.map((t) => ({
                label: typeLabel(t.type),
                value: t.count,
                color: TYPE_COLORS[t.type] ?? "var(--text-faint)",
              }))}
            />
          )}
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 font-semibold">Severity split</h2>
          {s && (
            <Donut
              centerValue={s.total}
              centerLabel="active"
              data={[
                { label: "High", value: s.high, color: "var(--danger)" },
                { label: "Medium", value: s.medium, color: "var(--caution)" },
                { label: "Low", value: s.low, color: "var(--clear)" },
              ]}
            />
          )}
        </Card>
      </div>
    </main>
  );
}
