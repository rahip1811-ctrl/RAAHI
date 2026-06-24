"use client";

import { useState } from "react";
import { SeverityChip, sevVar } from "@/components/ui";
import { hazardImage } from "@/lib/hazardImages";

export type Hazard = {
  id: string;
  type: string;
  severity: string;
  photo_url?: string | null;
  report_count?: number;
  distance_m?: number;
  created_at?: string;
  lat?: number;
  lng?: number;
};

const typeLabel = (t: string) =>
  t === "pothole" ? "Pothole" : t === "debris" ? "Debris" : "Construction";

function fmtDist(m?: number) {
  if (m == null) return null;
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

function ago(iso?: string) {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3.6e6);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function HazardCard({
  h,
  right,
}: {
  h: Hazard;
  right?: React.ReactNode;
}) {
  const dist = fmtDist(h.distance_m);
  const time = ago(h.created_at);
  const [imgErr, setImgErr] = useState(false);
  return (
    <div
      className="flex items-center gap-3 rounded-2xl border p-3"
      style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
    >
      {!imgErr ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={hazardImage(h.photo_url, h.type)}
          alt={h.type}
          onError={() => setImgErr(true)}
          className="h-14 w-14 shrink-0 rounded-xl object-cover"
        />
      ) : (
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-lg font-extrabold"
          style={{ background: "var(--surface-2)", color: sevVar(h.severity) }}
        >
          {typeLabel(h.type).charAt(0)}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-semibold">{typeLabel(h.type)}</span>
          <SeverityChip s={h.severity} />
        </div>
        <div className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
          {[
            dist,
            h.report_count && h.report_count > 1 ? `${h.report_count} reports` : null,
            time,
          ]
            .filter(Boolean)
            .join(" · ")}
        </div>
      </div>

      {right}
    </div>
  );
}
