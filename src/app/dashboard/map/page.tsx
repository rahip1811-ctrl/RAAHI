"use client";

import { useState } from "react";
import DashHeader from "@/components/DashHeader";
import DashboardMap from "@/components/DashboardMap";

const LAYERS = ["Hazards", "Traffic", "Roads"];
const LEGEND = [
  { label: "High density", color: "#ef4444" },
  { label: "Medium density", color: "#f59e0b" },
  { label: "Low density", color: "#22c55e" },
  { label: "Live reports", color: "var(--brand-strong)" },
];

export default function DashMapPage() {
  const [layers, setLayers] = useState<Record<string, boolean>>({ Hazards: true, Traffic: true, Roads: false });

  return (
    <main className="flex h-screen flex-col px-6 py-7 lg:px-8">
      <DashHeader title="City hazard map" subtitle="Live density heatmap across Ahmedabad." />
      <div className="relative flex-1 overflow-hidden rounded-2xl border" style={{ borderColor: "var(--border)", minHeight: "400px" }}>
        <DashboardMap />

        {/* overlay control card */}
        <div className="absolute left-4 top-4 z-10 w-52 rounded-2xl border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)", boxShadow: "var(--shadow)" }}>
          <div className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>Map layers</div>
          <div className="mt-2 space-y-1.5 text-sm">
            {LAYERS.map((l) => (
              <label key={l} className="flex cursor-pointer items-center gap-2">
                <input type="checkbox" checked={!!layers[l]} onChange={() => setLayers((p) => ({ ...p, [l]: !p[l] }))} style={{ accentColor: "var(--brand)" }} />
                {l}
              </label>
            ))}
          </div>
          <div className="mt-4 text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>Legend</div>
          <div className="mt-2 space-y-1.5 text-sm">
            {LEGEND.map((l) => (
              <div key={l.label} className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ background: l.color }} />
                {l.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
