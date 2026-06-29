"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import DashHeader from "@/components/DashHeader";
import { SeverityChip, sevVar } from "@/components/ui";
import { IconCheck, IconAlert, IconClock, IconLayers, IconX, IconPin, IconChevronRight } from "@/components/icons";
import { hazardImage } from "@/lib/hazardImages";

type Report = { id: string; type: string; severity: string; status: string; photo_url: string | null; report_count: number; created_at: string; location: string; comments: number; lat: number; lng: number };
type Summary = { active: number; today: number; critical: number; verifiedRate: number };

const typeLabel = (t: string) => (t === "pothole" ? "Pothole" : t === "debris" ? "Debris" : "Construction");
const TYPE_COLORS: Record<string, string> = { pothole: "#ef4444", debris: "#f59e0b", construction: "#6366f1" };
const TABS = ["all", "pothole", "debris", "construction"];

function ago(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 60) return `${Math.max(1, m)} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function Stat({ label, value, color, icon }: { label: string; value: React.ReactNode; color: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="flex items-center justify-between"><span className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</span><span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `${color}1f`, color }}>{icon}</span></div>
      <div className="font-display mt-1.5 text-2xl font-extrabold stat-pop" style={{ color }}>{value}</div>
    </div>
  );
}

function HazardArt({ type, className = "" }: { type: string; className?: string }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <svg viewBox="0 0 200 130" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        <rect width="200" height="130" fill="#8b95a3" />
        <rect width="200" height="130" fill="#000" opacity="0.04" />
        <line x1="100" y1="-5" x2="100" y2="135" stroke="#eef2f6" strokeWidth="5" strokeDasharray="16 13" opacity="0.6" />
        {type === "construction" ? (
          <g>
            <rect x="22" y="34" width="156" height="16" rx="2" fill="#f3a712" />
            <g fill="#1f2933" opacity="0.85">
              <polygon points="22,34 40,34 26,50 22,50" />
              <polygon points="54,34 72,34 58,50 40,50" />
              <polygon points="86,34 104,34 90,50 72,50" />
              <polygon points="118,34 136,34 122,50 104,50" />
              <polygon points="150,34 168,34 154,50 136,50" />
            </g>
            <polygon points="100,52 120,104 80,104" fill="#fb6514" />
            <rect x="82" y="104" width="36" height="10" rx="2" fill="#e0490b" />
            <rect x="88" y="70" width="24" height="7" fill="#fff" />
            <rect x="85" y="84" width="30" height="7" fill="#fff" />
          </g>
        ) : type === "debris" ? (
          <g>
            <ellipse cx="100" cy="104" rx="70" ry="12" fill="#000" opacity="0.12" />
            <polygon points="58,74 76,66 88,80 70,92" fill="#6b7480" />
            <polygon points="92,70 116,62 128,84 104,94" fill="#52606d" />
            <circle cx="138" cy="86" r="12" fill="#7b8794" />
            <circle cx="74" cy="92" r="8" fill="#9aa5b1" />
            <polygon points="118,92 134,88 138,104 120,108" fill="#3e4c59" />
            <circle cx="96" cy="98" r="5" fill="#8a96a3" />
          </g>
        ) : (
          <g>
            <path d="M62 80 Q50 60 74 52 Q104 44 128 58 Q150 72 132 90 Q112 106 86 100 Q66 95 62 80 Z" fill="#262b31" />
            <path d="M80 76 Q74 66 92 62 Q112 58 122 70 Q128 80 114 86 Q96 92 84 84 Q78 80 80 76 Z" fill="#111418" />
            <path d="M48 46 L56 54 M156 44 L146 54 M160 96 L148 88 M40 96 L52 90" stroke="#5c6470" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        )}
      </svg>
    </div>
  );
}

function Thumb({ url, type, className = "", contain = false }: { url: string | null; type: string; className?: string; contain?: boolean }) {
  const [err, setErr] = useState(false);
  if (!err) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={hazardImage(url, type)} alt="" onError={() => setErr(true)} className={`${contain ? "object-contain" : "object-cover"} ${className}`} />;
  }
  return <HazardArt type={type} className={className} />;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[] | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [tab, setTab] = useState("all");
  const [selId, setSelId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/reports").then((r) => r.json()).then((d) => { setReports(d.reports ?? []); setSummary(d.summary ?? null); }).catch(() => setReports([]));
  }, []);

  const filtered = useMemo(() => (reports ?? []).filter((r) => tab === "all" || r.type === tab), [reports, tab]);
  const sel = (reports ?? []).find((r) => r.id === selId) ?? null;

  async function resolve(id: string, reopen = false) {
    setBusy(true); setMsg("");
    try {
      const res = await fetch(`/api/hazards/${id}/resolve`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reopen }) });
      if (res.status === 401) { setMsg("Please log in to resolve."); return; }
      if (!res.ok) { setMsg("Could not update — has the resolved migration been run?"); return; }
      setReports((prev) => (prev ?? []).map((r) => (r.id === id ? { ...r, status: reopen ? "active" : "resolved" } : r)));
    } catch { setMsg("Network error."); } finally { setBusy(false); }
  }

  return (
    <main className="relative px-6 py-7 lg:px-8">
      <span className="page-glow" style={{ top: -120, left: 150 }} />
      <div className="relative">
        <DashHeader title="Reports" subtitle="Every hazard report in the system." />

        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Active reports" value={summary?.active ?? "—"} color="var(--brand-strong)" icon={<IconLayers size={16} />} />
          <Stat label="Reported today" value={summary?.today ?? "—"} color="#3b82f6" icon={<IconClock size={16} />} />
          <Stat label="Critical reports" value={summary?.critical ?? "—"} color="#ef4444" icon={<IconAlert size={16} />} />
          <Stat label="Verified rate" value={summary ? `${summary.verifiedRate}%` : "—"} color="var(--clear)" icon={<IconCheck size={16} />} />
        </div>

        {/* tabs */}
        <div className="mb-3 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} className="btn-press rounded-full border px-4 py-1.5 text-sm font-semibold capitalize"
              style={{ borderColor: tab === t ? "var(--brand)" : "var(--border)", background: tab === t ? "var(--brand-soft)" : "var(--surface)", color: tab === t ? "var(--brand-strong)" : "var(--text-muted)" }}>
              {t === "all" ? "All" : typeLabel(t)}
            </button>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          {/* list */}
          <div className="overflow-hidden rounded-2xl border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            {!reports && <p className="p-5 text-sm" style={{ color: "var(--text-faint)" }}>Loading…</p>}
            {reports && filtered.length === 0 && <p className="p-5 text-sm" style={{ color: "var(--text-muted)" }}>No reports.</p>}
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {filtered.map((r) => (
                <button key={r.id} onClick={() => setSelId(r.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--surface-2)]" style={{ background: selId === r.id ? "var(--surface-2)" : undefined }}>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold" style={{ background: `${TYPE_COLORS[r.type]}1f`, color: TYPE_COLORS[r.type] }}>{typeLabel(r.type).charAt(0)}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2"><span className="truncate font-semibold">{typeLabel(r.type)}</span>{r.status === "resolved" && <span className="r-chip" style={{ color: "var(--clear)", background: "var(--clear-soft)" }}>Resolved</span>}</div>
                    <div className="truncate text-xs" style={{ color: "var(--text-faint)" }}>{r.location} · {ago(r.created_at)}</div>
                  </div>
                  <span className="hidden text-xs sm:block" style={{ color: "var(--text-muted)" }}>{r.report_count} conf.</span>
                  <SeverityChip s={r.severity} />
                  <Thumb url={r.photo_url} type={r.type} className="hidden h-10 w-10 rounded-lg sm:block" />
                  <IconChevronRight size={16} />
                </button>
              ))}
            </div>
          </div>

          {/* detail panel */}
          <div className="rounded-2xl border" style={{ background: "var(--surface)", borderColor: "var(--border)", height: "fit-content" }}>
            {!sel ? (
              <div className="flex h-full items-center justify-center p-10 text-center text-sm" style={{ color: "var(--text-faint)" }}>Select a report to see details.</div>
            ) : (
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <SeverityChip s={sel.severity} />
                  <button onClick={() => setSelId(null)} style={{ color: "var(--text-faint)" }}><IconX size={18} /></button>
                </div>
                <h2 className="font-display mt-2 text-xl font-extrabold">{typeLabel(sel.type)}</h2>
                <div className="mt-1 flex items-center gap-1 text-sm" style={{ color: "var(--text-muted)" }}><IconPin size={14} /> {sel.location}</div>
                <div className="text-xs" style={{ color: "var(--text-faint)" }}>Reported {ago(sel.created_at)}</div>

                <div className="mt-4 flex gap-2">
                  <Link href={`/dashboard/map?lat=${sel.lat}&lng=${sel.lng}&label=${encodeURIComponent(typeLabel(sel.type))}`} className="btn-press flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold" style={{ background: "var(--brand)", color: "var(--brand-ink)" }}><IconPin size={15} /> View on map</Link>
                  {sel.status === "resolved" ? (
                    <button disabled={busy} onClick={() => resolve(sel.id, true)} className="btn-press rounded-xl border px-4 py-2.5 text-sm font-semibold" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>Reopen</button>
                  ) : (
                    <button disabled={busy} onClick={() => resolve(sel.id)} className="btn-press flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold" style={{ borderColor: "var(--border)", color: "var(--clear)" }}><IconCheck size={15} /> {busy ? "…" : "Mark resolved"}</button>
                  )}
                </div>
                {msg && <p className="mt-2 text-xs" style={{ color: "var(--caution)" }}>{msg}</p>}

                <div className="mt-4 flex items-center justify-center overflow-hidden rounded-xl border" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
                  <Thumb url={sel.photo_url} type={sel.type} contain className="h-56 w-full" />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}><div className="text-xs" style={{ color: "var(--text-faint)" }}>Confirmations</div><div className="font-display text-lg font-extrabold">{sel.report_count}</div></div>
                  <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}><div className="text-xs" style={{ color: "var(--text-faint)" }}>Comments</div><div className="font-display text-lg font-extrabold">{sel.comments}</div></div>
                </div>
                <div className="mt-3 flex items-center gap-2 rounded-xl border p-3 text-sm" style={{ borderColor: "var(--border)" }}>
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: sevVar(sel.severity) }} />
                  <span style={{ color: "var(--text-muted)" }}>{sel.status === "resolved" ? "This hazard has been resolved." : "Active — confirmed by the community."}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
