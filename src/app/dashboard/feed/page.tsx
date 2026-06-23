"use client";

import { useEffect, useState } from "react";
import DashHeader from "@/components/DashHeader";
import { Card, SeverityChip } from "@/components/ui";
import { IconClock } from "@/components/icons";

type Hz = { id: string; type: string; severity: string; report_count?: number; created_at?: string };

const typeLabel = (t: string) =>
  t === "pothole" ? "Pothole" : t === "debris" ? "Debris" : "Construction";
const TYPE_COLORS: Record<string, string> = { pothole: "#ef4444", debris: "#f59e0b", construction: "#6366f1" };

function ago(iso?: string) {
  if (!iso) return "";
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3.6e6);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function FeedPage() {
  const [feed, setFeed] = useState<Hz[] | null>(null);

  useEffect(() => {
    fetch("/api/hazards").then((r) => r.json()).then((d) => setFeed(d.hazards ?? [])).catch(() => setFeed([]));
  }, []);

  return (
    <main className="px-6 py-7 lg:px-8">
      <DashHeader title="Live report feed" subtitle="Every active hazard, newest first." />
      <Card className="p-3">
        {!feed && <p className="p-4 text-sm" style={{ color: "var(--text-faint)" }}>Loading…</p>}
        {feed && feed.length === 0 && <p className="p-4 text-sm" style={{ color: "var(--text-muted)" }}>No reports yet.</p>}
        <div className="divide-y" style={{ borderColor: "var(--border)" }}>
          {feed?.map((h) => (
            <div key={h.id} className="flex items-center gap-3 p-3" style={{ borderColor: "var(--border)" }}>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold" style={{ background: "var(--surface-2)", color: TYPE_COLORS[h.type] }}>
                {typeLabel(h.type).charAt(0)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{typeLabel(h.type)}</div>
                <div className="flex items-center gap-1 text-xs" style={{ color: "var(--text-faint)" }}>
                  <IconClock size={11} /> {ago(h.created_at)}
                  {h.report_count && h.report_count > 1 ? ` · ${h.report_count} reports` : ""}
                </div>
              </div>
              <SeverityChip s={h.severity} />
            </div>
          ))}
        </div>
      </Card>
    </main>
  );
}
