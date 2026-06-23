"use client";

import { useEffect, useState } from "react";
import HazardCard, { type Hazard } from "@/components/HazardCard";
import { Button } from "@/components/ui";
import { IconNear } from "@/components/icons";

export default function NearbyPage() {
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
            radius: "8000",
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
      <h1 className="font-display text-2xl font-extrabold">Nearby hazards</h1>
      <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
        Active hazards within 8 km of you, closest first.
      </p>

      <div className="mt-6 space-y-3">
        {(state === "locating" || state === "loading") && (
          <p className="text-sm" style={{ color: "var(--text-faint)" }}>
            {state === "locating" ? "Finding your location…" : "Loading hazards…"}
          </p>
        )}

        {state === "error" && (
          <div className="rounded-2xl border p-5 text-center" style={{ borderColor: "var(--border)" }}>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Couldn’t get your location. Allow location access and try again.
            </p>
            <Button variant="outline" size="sm" className="mt-3" onClick={load}>
              Retry
            </Button>
          </div>
        )}

        {state === "ready" && hazards && hazards.length === 0 && (
          <div className="flex flex-col items-center rounded-2xl border p-8 text-center" style={{ borderColor: "var(--border)" }}>
            <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "var(--clear-soft)", color: "var(--clear)" }}>
              <IconNear size={24} />
            </div>
            <p className="mt-3 font-semibold">All clear nearby</p>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              No reported hazards around you right now.
            </p>
          </div>
        )}

        {state === "ready" &&
          hazards?.map((h) => <HazardCard key={h.id} h={h} />)}
      </div>
    </main>
  );
}
