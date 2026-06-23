"use client";

import { useEffect, useState } from "react";
import { type Hazard } from "@/components/HazardCard";
import { Button, SeverityChip, sevVar, sevSoft } from "@/components/ui";
import { IconVoice, IconBell } from "@/components/icons";

const typeLabel = (t: string) =>
  t === "pothole" ? "Pothole" : t === "debris" ? "Debris" : "Construction";

function fmtDist(m?: number) {
  if (m == null) return "";
  return m < 1000 ? `${Math.round(m)} m away` : `${(m / 1000).toFixed(1)} km away`;
}

export default function AlertsPage() {
  const [hazards, setHazards] = useState<Hazard[] | null>(null);
  const [state, setState] = useState<"locating" | "loading" | "ready" | "error">("locating");

  function load() {
    setState("locating");
    navigator.geolocation.getCurrentPosition(
      async (p) => {
        setState("loading");
        try {
          const q = new URLSearchParams({
            lat: String(p.coords.latitude),
            lng: String(p.coords.longitude),
            radius: "3000",
          });
          const res = await fetch(`/api/hazards?${q}`);
          const data = await res.json();
          setHazards(data.hazards ?? []);
          setState("ready");
        } catch {
          setState("error");
        }
      },
      () => setState("error"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="mx-auto min-h-screen max-w-lg px-5 pb-28 pt-6" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <h1 className="font-display text-2xl font-extrabold">Alerts</h1>
      <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
        Hazards within 3 km that RAAHI will warn you about while driving.
      </p>

      <div
        className="mt-4 flex items-center gap-3 rounded-2xl border p-3.5"
        style={{ background: "var(--brand-soft)", borderColor: "var(--border)" }}
      >
        <IconVoice size={20} />
        <p className="text-sm" style={{ color: "var(--text)" }}>
          Voice warnings trigger automatically as you approach each one.
        </p>
      </div>

      <div className="mt-5 space-y-3">
        {(state === "locating" || state === "loading") && (
          <p className="text-sm" style={{ color: "var(--text-faint)" }}>
            {state === "locating" ? "Finding your location…" : "Loading alerts…"}
          </p>
        )}

        {state === "error" && (
          <div className="rounded-2xl border p-5 text-center" style={{ borderColor: "var(--border)" }}>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Couldn’t get your location. Allow access and try again.
            </p>
            <Button variant="outline" size="sm" className="mt-3" onClick={load}>Retry</Button>
          </div>
        )}

        {state === "ready" && hazards && hazards.length === 0 && (
          <div className="flex flex-col items-center rounded-2xl border p-8 text-center" style={{ borderColor: "var(--border)" }}>
            <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "var(--clear-soft)", color: "var(--clear)" }}>
              <IconBell size={24} />
            </div>
            <p className="mt-3 font-semibold">No alerts right now</p>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              You’re clear within 3 km. Drive safe.
            </p>
          </div>
        )}

        {state === "ready" &&
          hazards?.map((h) => (
            <div
              key={h.id}
              className="flex items-center gap-3 rounded-2xl border p-4"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ background: sevSoft(h.severity), color: sevVar(h.severity) }}
              >
                <IconVoice size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{typeLabel(h.type)} ahead</span>
                  <SeverityChip s={h.severity} />
                </div>
                <div className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                  {fmtDist(h.distance_m)}
                </div>
              </div>
            </div>
          ))}
      </div>
    </main>
  );
}
