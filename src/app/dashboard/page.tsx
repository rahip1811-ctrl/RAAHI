"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardMap from "@/components/DashboardMap";
import Donut from "@/components/Donut";
import ThemeToggle from "@/components/ThemeToggle";
import { SeverityChip } from "@/components/ui";
import { hazardImage } from "@/lib/hazardImages";
import {
  IconLayers, IconAlert, IconTrend, IconVoice, IconFeed, IconUsers,
  IconClock, IconBell, IconChevronRight,
} from "@/components/icons";

type Dash = {
  stats: { total: number; high: number; medium: number; low: number };
  byType: { type: string; count: number }[];
  hotspots: { name: string; count: number; score: number }[];
};
type Hz = { id: string; type: string; severity: string; report_count?: number; created_at?: string; photo_url?: string | null };

function FeedImg({ h }: { h: Hz }) {
  const [err, setErr] = useState(false);
  if (!err) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={hazardImage(h.photo_url, h.type)} alt="" onError={() => setErr(true)} className="h-9 w-9 shrink-0 rounded-lg object-cover" />;
  }
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold" style={{ background: `${TYPE_COLORS[h.type]}1f`, color: TYPE_COLORS[h.type] }}>
      {typeLabel(h.type).charAt(0)}
    </span>
  );
}

const typeLabel = (t: string) => (t === "pothole" ? "Pothole" : t === "debris" ? "Debris" : "Construction");
const TYPE_COLORS: Record<string, string> = { pothole: "#ef4444", debris: "#f59e0b", construction: "#6366f1" };

function ago(iso?: string) {
  if (!iso) return "";
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3.6e6);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function StatCard({ label, value, color, soft, icon }: { label: string; value: React.ReactNode; color: string; soft: string; icon: React.ReactNode }) {
  return (
    <div className="lift rounded-2xl border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{label}</span>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: soft, color }}>{icon}</span>
      </div>
      <div className="font-display mt-2 text-3xl font-extrabold stat-pop" style={{ color }}>{value}</div>
      <div className="mt-1 flex items-center gap-1 text-[0.7rem]" style={{ color: "var(--text-faint)" }}>
        <span className="live-dot" style={{ width: 6, height: 6 }} /> live
      </div>
    </div>
  );
}

export default function DashboardOverview() {
  const [data, setData] = useState<Dash | null>(null);
  const [feed, setFeed] = useState<Hz[]>([]);
  const [contributors, setContributors] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/dashboard").then((r) => r.json()).then((d) => { if (d && d.stats) setData(d); }).catch(() => {});
    fetch("/api/hazards").then((r) => r.json()).then((d) => setFeed(d.hazards ?? [])).catch(() => {});
    fetch("/api/leaderboard").then((r) => r.json()).then((d) => setContributors((d.leaders ?? []).length)).catch(() => {});
  }, []);

  const s = data?.stats;
  const totalReports = feed.reduce((a, b) => a + (b.report_count || 1), 0);

  return (
    <main className="relative px-6 py-6 lg:px-8">
      <span className="page-glow" style={{ top: -140, right: 80 }} />
      <div className="relative">
        {/* header */}
        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-extrabold">Dashboard Overview</h1>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>Real-time city safety intelligence · Ahmedabad</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-2 rounded-xl border px-3 py-2 text-sm sm:flex" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
              <IconClock size={15} /> Last 7 days
            </span>
            <ThemeToggle compact />
            <span className="relative flex h-9 w-9 items-center justify-center rounded-xl border" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
              <IconBell size={16} />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full" style={{ background: "var(--danger)" }} />
            </span>
          </div>
        </header>

        {/* stat cards */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <StatCard label="Active hazards" value={s?.total ?? "—"} color="var(--brand-strong)" soft="var(--brand-soft)" icon={<IconLayers size={16} />} />
          <StatCard label="High severity" value={s?.high ?? "—"} color="var(--danger)" soft="var(--danger-soft)" icon={<IconAlert size={16} />} />
          <StatCard label="Medium" value={s?.medium ?? "—"} color="var(--caution)" soft="var(--caution-soft)" icon={<IconTrend size={16} />} />
          <StatCard label="Low" value={s?.low ?? "—"} color="var(--clear)" soft="var(--clear-soft)" icon={<IconVoice size={16} />} />
          <StatCard label="Total reports" value={feed.length ? totalReports : "—"} color="#3b82f6" soft="#3b82f622" icon={<IconFeed size={16} />} />
          <StatCard label="Contributors" value={contributors ?? "—"} color="#8b5cf6" soft="#8b5cf622" icon={<IconUsers size={16} />} />
        </div>

        {/* feed + heatmap */}
        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          <div className="flex flex-col rounded-2xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Live report feed</h2>
              <span className="r-chip" style={{ color: "var(--clear)", background: "var(--clear-soft)" }}><span className="live-dot" /> Live</span>
            </div>
            <div className="thin-scroll max-h-[300px] space-y-2 overflow-y-auto">
              {feed.length === 0 && <p className="text-sm" style={{ color: "var(--text-faint)" }}>No reports yet.</p>}
              {feed.slice(0, 10).map((h) => (
                <div key={h.id} className="flex items-center gap-3 rounded-xl border p-2.5" style={{ borderColor: "var(--border)" }}>
                  <FeedImg h={h} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{typeLabel(h.type)}</div>
                    <div className="text-xs" style={{ color: "var(--text-faint)" }}>Ahmedabad · {ago(h.created_at)}</div>
                  </div>
                  <SeverityChip s={h.severity} />
                </div>
              ))}
            </div>
            <Link href="/dashboard/feed" className="mt-3 flex items-center justify-center gap-1 text-sm font-semibold" style={{ color: "var(--brand-strong)" }}>
              View all reports <IconChevronRight size={15} />
            </Link>
          </div>

          <div className="card-accent overflow-hidden rounded-2xl border lg:col-span-2" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between border-b p-4" style={{ borderColor: "var(--border)" }}>
              <h2 className="font-semibold">City hazard heatmap</h2>
              <span className="text-xs" style={{ color: "var(--text-faint)" }}>density × severity</span>
            </div>
            <div className="h-[300px]"><DashboardMap /></div>
          </div>
        </div>

        {/* hotspots + donuts */}
        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          <div className="rounded-2xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <h2 className="mb-3 font-semibold">Top hotspots</h2>
            <div className="space-y-3">
              {!data && <p className="text-sm" style={{ color: "var(--text-faint)" }}>Loading…</p>}
              {data?.hotspots?.slice(0, 5).map((h, i) => {
                const max = Math.max(1, ...(data?.hotspots?.map((x) => x.score) ?? [1]));
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-4 text-sm font-bold" style={{ color: "var(--text-muted)" }}>{i + 1}</span>
                    <span className="w-24 truncate text-sm font-medium">{h.name}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full" style={{ background: "var(--surface-2)" }}>
                      <div className="h-full rounded-full" style={{ width: `${(h.score / max) * 100}%`, backgroundImage: "linear-gradient(90deg, var(--danger), var(--caution))" }} />
                    </div>
                    <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>{h.score}</span>
                  </div>
                );
              })}
            </div>
            <Link href="/dashboard/hotspots" className="mt-4 flex items-center justify-center gap-1 text-sm font-semibold" style={{ color: "var(--brand-strong)" }}>
              View all hotspots <IconChevronRight size={15} />
            </Link>
          </div>

          <div className="rounded-2xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <h2 className="mb-4 font-semibold">Hazard types</h2>
            {data && <Donut centerValue={data.byType.reduce((a, b) => a + b.count, 0)} centerLabel="reports" data={data.byType.map((t) => ({ label: typeLabel(t.type), value: t.count, color: TYPE_COLORS[t.type] ?? "var(--text-faint)" }))} />}
          </div>

          <div className="rounded-2xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <h2 className="mb-4 font-semibold">Severity split</h2>
            {s && <Donut centerValue={s.total} centerLabel="active" data={[{ label: "High", value: s.high, color: "var(--danger)" }, { label: "Medium", value: s.medium, color: "var(--caution)" }, { label: "Low", value: s.low, color: "var(--clear)" }]} />}
          </div>
        </div>
      </div>
    </main>
  );
}
