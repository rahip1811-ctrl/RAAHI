"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import HazardCard, { type Hazard } from "@/components/HazardCard";
import { SeverityDot } from "@/components/ui";
import { IconPin, IconChevronRight } from "@/components/icons";

const LAYERS = ["Hazards", "Traffic", "Roads"];

export default function DriverPanels() {
  const [hazards, setHazards] = useState<Hazard[]>([]);
  const [layers, setLayers] = useState<Record<string, boolean>>({ Hazards: true, Traffic: true, Roads: false });

  useEffect(() => {
    const load = (url: string) => fetch(url).then((r) => r.json()).then((d) => setHazards(d.hazards ?? [])).catch(() => {});
    navigator.geolocation?.getCurrentPosition(
      (p) => load(`/api/hazards?lat=${p.coords.latitude}&lng=${p.coords.longitude}&radius=12000`),
      () => load("/api/hazards"),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  return (
    <>
      {/* ── left control stack ── */}
      <div className="pointer-events-none absolute left-3 top-20 z-10 hidden w-60 flex-col gap-3 md:flex">
        <div className="pointer-events-auto rounded-2xl border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow)" }}>
          <div className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>Hazard severity</div>
          <div className="mt-2 space-y-1.5 text-sm">
            <div className="flex items-center gap-2"><SeverityDot s="high" /> High</div>
            <div className="flex items-center gap-2"><SeverityDot s="medium" /> Medium</div>
            <div className="flex items-center gap-2"><SeverityDot s="low" /> Low</div>
          </div>
          <div className="mt-4 text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>Map layers</div>
          <div className="mt-2 space-y-1.5 text-sm">
            {LAYERS.map((l) => (
              <label key={l} className="flex cursor-pointer items-center gap-2">
                <input type="checkbox" checked={!!layers[l]} onChange={() => setLayers((p) => ({ ...p, [l]: !p[l] }))} style={{ accentColor: "var(--brand)" }} />
                {l}
              </label>
            ))}
          </div>
        </div>

        <Link href="/app/report" className="btn-press pointer-events-auto flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold" style={{ background: "var(--brand)", color: "var(--brand-ink)", boxShadow: "var(--shadow)" }}>
          <IconPin size={16} /> Report a hazard
        </Link>
        <Link href="/app/profile" className="btn-press pointer-events-auto flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 font-semibold" style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)", boxShadow: "var(--shadow-sm)" }}>
          My reports
        </Link>
      </div>

      {/* ── right nearby panel ── */}
      <div className="pointer-events-none absolute right-3 top-20 z-10 hidden w-72 md:block">
        <div className="pointer-events-auto rounded-2xl border" style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow)" }}>
          <div className="flex items-center justify-between border-b p-4" style={{ borderColor: "var(--border)" }}>
            <span className="font-semibold">Nearby hazards</span>
            <Link href="/app/nearby" className="text-xs font-semibold" style={{ color: "var(--brand-strong)" }}>View all</Link>
          </div>
          <div className="thin-scroll max-h-[60vh] space-y-2 overflow-y-auto p-3">
            {hazards.length === 0 && <p className="p-2 text-sm" style={{ color: "var(--text-faint)" }}>Loading nearby hazards…</p>}
            {hazards.slice(0, 6).map((h) => (
              <HazardCard key={h.id} h={h} right={<IconChevronRight size={16} />} />
            ))}
          </div>
        </div>
      </div>

    </>
  );
}
