"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import DashHeader from "@/components/DashHeader";
import { SeverityChip } from "@/components/ui";
import { IconChevronRight, IconSearch, IconX, IconPin } from "@/components/icons";
import { hazardImage } from "@/lib/hazardImages";

type Hz = { id: string; type: string; severity: string; report_count?: number; created_at?: string; lat?: number; lng?: number; photo_url?: string | null; status?: string };

const typeLabel = (t: string) => (t === "pothole" ? "Pothole" : t === "debris" ? "Debris" : "Construction");
const TYPE_COLORS: Record<string, string> = { pothole: "#ef4444", debris: "#f59e0b", construction: "#6366f1" };

function ago(iso?: string) {
  if (!iso) return "";
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const selectClass = "rounded-xl border px-3 py-2 text-sm font-medium outline-none";

export default function FeedPage() {
  const [feed, setFeed] = useState<Hz[] | null>(null);
  const [type, setType] = useState("all");
  const [sev, setSev] = useState("all");
  const [sel, setSel] = useState<Hz | null>(null);

  useEffect(() => {
    fetch("/api/hazards").then((r) => r.json()).then((d) => setFeed(d.hazards ?? [])).catch(() => setFeed([]));
  }, []);

  const filtered = useMemo(() => {
    return (feed ?? []).filter((h) => (type === "all" || h.type === type) && (sev === "all" || h.severity === sev));
  }, [feed, type, sev]);

  return (
    <main className="relative px-6 py-7 lg:px-8">
      <span className="page-glow" style={{ top: -120, right: 120 }} />
      <div className="relative">
        <DashHeader title="Live report feed" subtitle="Every active hazard, newest first." />

        {/* filters */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
            <IconSearch size={15} /> Filters
          </span>
          <select value={type} onChange={(e) => setType(e.target.value)} className={selectClass} style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}>
            <option value="all">All types</option>
            <option value="pothole">Pothole</option>
            <option value="debris">Debris</option>
            <option value="construction">Construction</option>
          </select>
          <select value={sev} onChange={(e) => setSev(e.target.value)} className={selectClass} style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}>
            <option value="all">All severity</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div className="mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
          <span className="live-dot" /> {filtered.length} active {filtered.length === 1 ? "report" : "reports"}
        </div>

        <div className="overflow-hidden rounded-2xl border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          {!feed && <p className="p-5 text-sm" style={{ color: "var(--text-faint)" }}>Loading…</p>}
          {feed && filtered.length === 0 && <p className="p-5 text-sm" style={{ color: "var(--text-muted)" }}>No matching reports.</p>}
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {filtered.map((h) => (
              <button key={h.id} onClick={() => setSel(h)} className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--surface-2)]">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold" style={{ background: `${TYPE_COLORS[h.type]}1f`, color: TYPE_COLORS[h.type] }}>
                  {typeLabel(h.type).charAt(0)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{typeLabel(h.type)}</div>
                  <div className="text-xs" style={{ color: "var(--text-faint)" }}>Ahmedabad{h.report_count && h.report_count > 1 ? ` · ${h.report_count} confirmations` : ""}</div>
                </div>
                <span className="hidden text-sm sm:block" style={{ color: "var(--text-muted)" }}>{ago(h.created_at)}</span>
                <SeverityChip s={h.severity} />
                <IconChevronRight size={16} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {sel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSel(null)}>
          <div className="w-full max-w-md overflow-hidden rounded-2xl border" style={{ background: "var(--surface)", borderColor: "var(--border)" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between p-5 pb-0">
              <SeverityChip s={sel.severity} />
              <button onClick={() => setSel(null)} style={{ color: "var(--text-faint)" }}><IconX size={18} /></button>
            </div>
            <div className="px-5">
              <h2 className="font-display mt-2 text-xl font-extrabold">{typeLabel(sel.type)}</h2>
              <div className="mt-1 flex items-center gap-1 text-sm" style={{ color: "var(--text-muted)" }}><IconPin size={14} /> Ahmedabad</div>
              <div className="text-xs" style={{ color: "var(--text-faint)" }}>Reported {ago(sel.created_at)}</div>
            </div>
            {sel.photo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={hazardImage(sel.photo_url, sel.type)} alt="" className="mt-3 h-52 w-full object-cover" />
            )}
            <div className="grid grid-cols-2 gap-3 p-5 text-sm">
              <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}><div className="text-xs" style={{ color: "var(--text-faint)" }}>Confirmations</div><div className="font-display text-lg font-extrabold">{sel.report_count ?? 1}</div></div>
              <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}><div className="text-xs" style={{ color: "var(--text-faint)" }}>Severity</div><div className="font-display text-lg font-extrabold capitalize">{sel.severity}</div></div>
            </div>
            {Number.isFinite(sel.lat) && Number.isFinite(sel.lng) && (
              <div className="px-5 pb-5">
                <Link href={`/dashboard/map?lat=${sel.lat}&lng=${sel.lng}&label=${encodeURIComponent(typeLabel(sel.type))}`} className="btn-press flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold" style={{ background: "var(--brand)", color: "var(--brand-ink)" }}><IconPin size={15} /> View on map</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
