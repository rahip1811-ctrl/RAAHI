"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui";
import { IconVoice, IconBell, IconChevronRight } from "@/components/icons";

type Report = { id: string; type: string; severity: string; lat: number; lng: number; location: string; created_at?: string };
type WithDist = Report & { dist: number };

const typeLabel = (t: string) => (t === "pothole" ? "Pothole" : t === "debris" ? "Debris" : "Construction");
const sevColor = (s: string) => (s === "high" ? "var(--danger)" : s === "medium" ? "var(--caution)" : "var(--clear)");
const sevSoft = (s: string) => (s === "high" ? "var(--danger-soft)" : s === "medium" ? "var(--caution-soft)" : "var(--clear-soft)");

function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000, r = (d: number) => (d * Math.PI) / 180;
  const dLat = r(b.lat - a.lat), dLng = r(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
const fmt = (m: number) => (m < 1000 ? `${Math.round(m)} m away` : `${(m / 1000).toFixed(1)} km away`);

function TypeIcon({ type, size = 22 }: { type: string; size?: number }) {
  if (type === "construction")
    return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"><path d="M9 4h6l3 16H6L9 4Z" /><path d="M7.5 11h9M6.7 16h10.6" /></svg>);
  if (type === "debris")
    return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"><path d="m12 3 4 4-4 4-4-4 4-4Z" /><path d="m5 14 3 3-3 3-3-3 3-3ZM18 13l3 3-3 3-3-3 3-3Z" /></svg>);
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M4 13c2-2 4-2 4 0s2 2 4 0 4-2 4 0 2 2 4 0" /><path d="M4 17c2-2 4-2 4 0s2 2 4 0 4-2 4 0 2 2 4 0" /></svg>);
}

export default function AlertsPage() {
  const [items, setItems] = useState<WithDist[] | null>(null);
  const [state, setState] = useState<"locating" | "loading" | "ready" | "error">("locating");

  function load() {
    setState("locating");
    navigator.geolocation.getCurrentPosition(
      async (p) => {
        setState("loading");
        const me = { lat: p.coords.latitude, lng: p.coords.longitude };
        try {
          const res = await fetch("/api/reports");
          const data = await res.json();
          const reps: Report[] = data.reports ?? [];
          const within = reps
            .filter((r) => r.severity)
            .map((r) => ({ ...r, dist: haversine(me, { lat: r.lat, lng: r.lng }) }))
            .filter((r) => r.dist <= 3000)
            .sort((a, b) => a.dist - b.dist);
          setItems(within);
          setState("ready");
        } catch { setState("error"); }
      },
      () => setState("error"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  return (
    <main className="mx-auto min-h-screen max-w-lg px-5 pb-28 pt-6" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <h1 className="font-display text-2xl font-extrabold">Alerts</h1>
      <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>Hazards within 3 km that RAAHI will warn you about while driving.</p>

      <div className="mt-4 flex items-center gap-3 rounded-2xl border p-3.5" style={{ background: "var(--brand-soft)", borderColor: "var(--border)" }}>
        <IconVoice size={20} />
        <p className="text-sm">Voice warnings trigger automatically as you approach each one.</p>
      </div>

      <div className="mt-5 space-y-3">
        {(state === "locating" || state === "loading") && <p className="text-sm" style={{ color: "var(--text-faint)" }}>{state === "locating" ? "Finding your location…" : "Loading alerts…"}</p>}
        {state === "error" && (
          <div className="rounded-2xl border p-5 text-center" style={{ borderColor: "var(--border)" }}>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Couldn’t get your location. Allow access and try again.</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={load}>Retry</Button>
          </div>
        )}
        {state === "ready" && items && items.length === 0 && (
          <div className="flex flex-col items-center rounded-2xl border p-8 text-center" style={{ borderColor: "var(--border)" }}>
            <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "var(--clear-soft)", color: "var(--clear)" }}><IconBell size={24} /></div>
            <p className="mt-3 font-semibold">No alerts right now</p>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>You’re clear within 3 km. Drive safe.</p>
          </div>
        )}
        {state === "ready" && items?.map((h) => (
          <div key={h.id} className="flex items-center gap-3 rounded-2xl border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: sevSoft(h.severity), color: sevColor(h.severity) }}><TypeIcon type={h.type} /></span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate font-semibold">{typeLabel(h.type)} ahead</span>
                <span className="r-chip" style={{ color: sevColor(h.severity), background: sevSoft(h.severity) }}>{h.severity}</span>
              </div>
              <div className="mt-0.5 truncate text-xs" style={{ color: "var(--text-muted)" }}>{h.location}</div>
              <div className="text-xs font-medium" style={{ color: "var(--text-faint)" }}>{fmt(h.dist)}</div>
            </div>
          </div>
        ))}
      </div>

      <Link href="/app/alerts/settings" className="btn-press mt-3 flex items-center justify-between rounded-2xl border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <span className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}><IconBell size={18} /></span>
          <span><span className="block font-semibold">Alert settings</span><span className="block text-xs" style={{ color: "var(--text-muted)" }}>Manage how you’re notified</span></span>
        </span>
        <IconChevronRight size={18} />
      </Link>
    </main>
  );
}
