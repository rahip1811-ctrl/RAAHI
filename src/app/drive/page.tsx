"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { IconX, IconVoice, IconMute, IconCrosshair, IconNav, IconSearch, IconPin, IconCheck } from "@/components/icons";
import { getAlertPrefs, isTypeMuted, DEFAULT_PREFS, type AlertPrefs } from "@/lib/alertPrefs";

type Hazard = { id: string; type: string; severity: string; lat: number; lng: number };
type RouteData = { coordinates: [number, number][]; steps: { instruction: string; distance: number }[]; hazards: Hazard[]; distance: number; duration: number };
type Sugg = { description: string; mainText: string; secondaryText: string; lat: number | null; lng: number | null };

const sevColor = (s: string) => (s === "high" ? "#ff4d3d" : s === "medium" ? "#f59e0b" : "#22c55e");
const typeLabel = (t: string) => (t === "pothole" ? "Pothole" : t === "debris" ? "Debris" : "Construction");

function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000, toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export default function DrivePage() {
  const router = useRouter();
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const posMarker = useRef<maplibregl.Marker | null>(null);
  const hazardMarkers = useRef<maplibregl.Marker[]>([]);
  const watchId = useRef<number | null>(null);
  const spoken = useRef<Set<string>>(new Set());
  const voiceRef = useRef(true);
  const prefsRef = useRef<AlertPrefs>(DEFAULT_PREFS);

  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const [query, setQuery] = useState("");
  const [suggs, setSuggs] = useState<Sugg[]>([]);
  const [dest, setDest] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [route, setRoute] = useState<RouteData | null>(null);
  const [navigating, setNavigating] = useState(false);
  const [speed, setSpeed] = useState(0);
  const [voiceOn, setVoiceOn] = useState(true);
  const [next, setNext] = useState<{ h: Hazard; dist: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const OLA = process.env.NEXT_PUBLIC_OLA_MAPS_API_KEY;

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (p) => setOrigin({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => setOrigin({ lat: 23.0225, lng: 72.5714 }),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  // Create the map once on mount, so the container is guaranteed to have a size.
  useEffect(() => {
    if (mapRef.current || !mapEl.current) return;
    const c = origin ?? { lat: 23.0225, lng: 72.5714 };
    const map = new maplibregl.Map({
      container: mapEl.current,
      style: OLA
        ? "https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json"
        : { version: 8, sources: { osm: { type: "raster", tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"], tileSize: 256, maxzoom: 19 } }, layers: [{ id: "osm", type: "raster", source: "osm" }] },
      center: [c.lng, c.lat],
      zoom: 15,
      attributionControl: false,
      transformRequest: (url: string) => {
        if (OLA && url.includes("olamaps.io")) { const u = new URL(url); if (!u.searchParams.has("api_key")) u.searchParams.set("api_key", OLA); return { url: u.toString() }; }
        return { url };
      },
    });
    mapRef.current = map;
    map.on("error", (e) => { const m = (e && e.error && e.error.message) || ""; if (m.includes("3d_model")) return; });
    map.on("load", () => map.resize());
    map.on("style.load", () => map.resize());
    [80, 250, 600, 1200].forEach((t) => setTimeout(() => mapRef.current?.resize(), t));
    const el = document.createElement("div");
    el.style.cssText = "width:18px;height:18px;border-radius:50%;background:#2f6bff;border:3px solid #fff;box-shadow:0 0 0 6px rgba(47,107,255,.25)";
    posMarker.current = new maplibregl.Marker({ element: el }).setLngLat([c.lng, c.lat]).addTo(map);
    return () => {
      if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current);
      try { speechSynthesis.cancel(); } catch { /* ignore */ }
      try { map.remove(); } catch { /* ignore */ }
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recenter once geolocation resolves.
  useEffect(() => {
    if (!origin || !mapRef.current) return;
    mapRef.current.setCenter([origin.lng, origin.lat]);
    posMarker.current?.setLngLat([origin.lng, origin.lat]);
  }, [origin]);

  // Recompute the canvas size whenever the driving overlay toggles (your pattern).
  useEffect(() => {
    const t = setTimeout(() => mapRef.current?.resize(), 200);
    return () => clearTimeout(t);
  }, [navigating]);

  useEffect(() => {
    if (query.trim().length < 2) { setSuggs([]); return; }
    const t = setTimeout(async () => {
      try {
        const q = new URLSearchParams({ input: query });
        if (origin) { q.set("lat", String(origin.lat)); q.set("lng", String(origin.lng)); }
        const res = await fetch(`/api/places?${q}`); const d = await res.json(); setSuggs(d.suggestions ?? []);
      } catch { /* ignore */ }
    }, 300);
    return () => clearTimeout(t);
  }, [query, origin]);

  function pickDest(s: Sugg) {
    if (s.lat == null || s.lng == null) return;
    setDest({ lat: s.lat, lng: s.lng, name: s.mainText || s.description });
    setQuery(s.mainText || s.description); setSuggs([]);
    mapRef.current?.flyTo({ center: [s.lng, s.lat], zoom: 14 });
  }

  function chime() {
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.value = 880;
      g.gain.value = (prefsRef.current.volume / 100) * 0.3;
      o.connect(g); g.connect(ctx.destination); o.start();
      setTimeout(() => { o.stop(); ctx.close(); }, 180);
    } catch { /* ignore */ }
  }

  function speak(text: string) {
    if (!voiceRef.current) return;
    const prefs = prefsRef.current;
    if (prefs.delivery === "hidden") return;
    if (prefs.delivery === "chime") { chime(); return; }
    try {
      if ("speechSynthesis" in window) {
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 1; u.volume = prefs.volume / 100;
        speechSynthesis.speak(u);
      }
    } catch { /* ignore */ }
  }

  function drawRoute(d: RouteData) {
    const map = mapRef.current; if (!map) return;
    if (!map.isStyleLoaded()) { map.once("load", () => drawRoute(d)); return; }
    const gj = { type: "Feature" as const, geometry: { type: "LineString" as const, coordinates: d.coordinates }, properties: {} };
    const src = map.getSource("route") as maplibregl.GeoJSONSource | undefined;
    if (src) src.setData(gj);
    else {
      map.addSource("route", { type: "geojson", data: gj });
      map.addLayer({ id: "route-glow", type: "line", source: "route", paint: { "line-color": "#2f6bff", "line-width": 13, "line-opacity": 0.25, "line-blur": 4 } });
      map.addLayer({ id: "route-line", type: "line", source: "route", paint: { "line-color": "#2f6bff", "line-width": 5 } });
    }
    hazardMarkers.current.forEach((m) => m.remove()); hazardMarkers.current = [];
    for (const h of d.hazards) {
      const el = document.createElement("div");
      el.style.cssText = `width:16px;height:16px;border-radius:50%;background:${sevColor(h.severity)};border:2px solid #fff;box-shadow:0 0 0 5px ${sevColor(h.severity)}33`;
      hazardMarkers.current.push(new maplibregl.Marker({ element: el }).setLngLat([h.lng, h.lat]).addTo(map));
    }
    const lons = d.coordinates.map((c) => c[0]), lats = d.coordinates.map((c) => c[1]);
    if (lons.length) map.fitBounds([[Math.min(...lons), Math.min(...lats)], [Math.max(...lons), Math.max(...lats)]], { padding: 90, pitch: 55, duration: 900 });
  }

  function startWatch(d: RouteData) {
    if (!navigator.geolocation) return;
    watchId.current = navigator.geolocation.watchPosition((p) => {
      const cur = { lat: p.coords.latitude, lng: p.coords.longitude };
      const spd = p.coords.speed && p.coords.speed > 0 ? Math.round(p.coords.speed * 3.6) : 0;
      setSpeed(spd);
      posMarker.current?.setLngLat([cur.lng, cur.lat]);
      mapRef.current?.easeTo({ center: [cur.lng, cur.lat], zoom: 17, pitch: 60, duration: 600 });
      const prefs = prefsRef.current;
      const buffer = spd > 60 ? prefs.bufferHwy : prefs.bufferCity;
      let best: { h: Hazard; dist: number } | null = null;
      for (const h of d.hazards) {
        if (isTypeMuted(prefs, h.type)) continue;
        const dist = haversine(cur, { lat: h.lat, lng: h.lng });
        if (!best || dist < best.dist) best = { h, dist };
        if (dist < buffer && !spoken.current.has(h.id)) {
          if (prefs.cluster) {
            const near = d.hazards.filter((x) => x.type === h.type && !spoken.current.has(x.id) && haversine({ lat: h.lat, lng: h.lng }, { lat: x.lat, lng: x.lng }) < 100);
            if (near.length >= 3) { near.forEach((x) => spoken.current.add(x.id)); speak(`${typeLabel(h.type)} cluster ahead`); continue; }
          }
          spoken.current.add(h.id);
          speak(`${typeLabel(h.type)} ahead, ${Math.round(dist)} metres`);
        }
      }
      setNext(best && best.dist < 600 ? best : null);
    }, () => { }, { enableHighAccuracy: true, maximumAge: 1000 });
  }

  async function start() {
    if (!origin || !dest) return;
    setLoading(true); setErr("");
    try {
      const res = await fetch("/api/directions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ origin, destination: { lat: dest.lat, lng: dest.lng } }) });
      const d = await res.json();
      if (!res.ok) { setErr(d.error || "Could not get directions"); return; }
      prefsRef.current = getAlertPrefs();
      setRoute(d); drawRoute(d); setNavigating(true);
      if (d.hazards?.length) speak(`${d.hazards.length} hazard${d.hazards.length === 1 ? "" : "s"} on your route. Drive safe.`);
      else speak("Route is clear. Drive safe.");
      startWatch(d);
    } catch { setErr("Network error"); } finally { setLoading(false); }
  }

  function recenter() { const ll = posMarker.current?.getLngLat(); if (ll) mapRef.current?.easeTo({ center: [ll.lng, ll.lat], zoom: 17, pitch: 60 }); }
  function toggleVoice() { setVoiceOn((v) => { const nv = !v; voiceRef.current = nv; if (!nv) { try { speechSynthesis.cancel(); } catch { } } return nv; }); }
  function exit() { if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current); try { speechSynthesis.cancel(); } catch { } router.push("/app"); }

  return (
    <main style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden", color: "var(--text)", background: "#0b0e14" }}>
      {/* Map is permanently mounted with explicit pixel dimensions so the WebGL canvas never loses its size. */}
      <div ref={mapEl} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />

      <button onClick={exit} className="btn-press absolute left-4 top-4 z-30 flex h-11 w-11 items-center justify-center rounded-full" style={{ background: "var(--surface)", color: "var(--text)", boxShadow: "var(--shadow)" }} aria-label="Exit"><IconX size={20} /></button>

      {!navigating ? (
        <div className="absolute left-1/2 top-4 z-20 w-[92%] max-w-md -translate-x-1/2 pl-12">
          <div className="rounded-2xl border p-3" style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow)" }}>
            <div className="flex items-center gap-2 rounded-xl border px-3 py-2.5" style={{ borderColor: "var(--border)" }}>
              <IconSearch size={16} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Where to?" className="w-full bg-transparent text-sm outline-none" style={{ color: "var(--text)" }} />
            </div>
            {suggs.length > 0 && (
              <div className="thin-scroll mt-2 max-h-60 overflow-y-auto">
                {suggs.map((s, i) => (
                  <button key={i} onClick={() => pickDest(s)} className="flex w-full items-start gap-2 rounded-lg p-2 text-left hover:bg-[var(--surface-2)]">
                    <span style={{ color: "var(--brand-strong)" }}><IconPin size={16} /></span>
                    <span className="min-w-0"><span className="block truncate text-sm font-medium">{s.mainText}</span><span className="block truncate text-xs" style={{ color: "var(--text-muted)" }}>{s.secondaryText}</span></span>
                  </button>
                ))}
              </div>
            )}
            {dest && (
              <button onClick={start} disabled={loading} className="btn-press mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3 font-semibold" style={{ background: "var(--brand)", color: "var(--brand-ink)" }}>
                {loading ? "Finding route…" : <>Start drive <IconNav size={16} /></>}
              </button>
            )}
            {err && <p className="mt-2 text-sm" style={{ color: "var(--danger)" }}>{err}</p>}
          </div>
        </div>
      ) : (
        <>
          <div className="absolute left-1/2 top-4 z-20 w-[92%] max-w-md -translate-x-1/2 pl-12">
            {next ? (
              <div className="flex items-center gap-3 rounded-2xl border px-4 py-3" style={{ background: "var(--surface)", borderColor: sevColor(next.h.severity), boxShadow: "var(--shadow)" }}>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${sevColor(next.h.severity)}22`, color: sevColor(next.h.severity) }}><IconVoice size={20} /></span>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{typeLabel(next.h.type)} ahead · {Math.round(next.dist)} m</div>
                  <div className="text-xs capitalize" style={{ color: "var(--text-muted)" }}>{next.h.severity} severity · stay alert</div>
                </div>
              </div>
            ) : (route?.hazards.length ?? 0) === 0 ? (
              <div className="flex items-center gap-3 rounded-2xl border px-4 py-3" style={{ background: "var(--brand-soft)", borderColor: "color-mix(in srgb, var(--brand) 45%, var(--border))", boxShadow: "0 8px 30px -8px var(--brand)" }}>
                <span className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: "var(--brand)", color: "var(--brand-ink)" }}><IconCheck size={22} strokeWidth={2.4} /></span>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-extrabold uppercase tracking-wide" style={{ color: "var(--brand-strong)" }}>Safe corridor verified</div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>No potholes, debris or construction on this route.</div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-2xl border px-4 py-3" style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow)" }}>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "var(--brand-soft)", color: "var(--brand-strong)" }}><IconVoice size={20} /></span>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">Route clear ahead</div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>{route?.hazards.length} hazards mapped on your route</div>
                </div>
              </div>
            )}
          </div>

          <div className="absolute right-4 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-2.5">
            <button onClick={recenter} className="btn-press flex h-11 w-11 items-center justify-center rounded-full" style={{ background: "var(--surface)", color: "var(--text)", boxShadow: "var(--shadow)" }} aria-label="Recenter"><IconCrosshair size={20} /></button>
            <button onClick={toggleVoice} className="btn-press flex h-11 w-11 items-center justify-center rounded-full" style={{ background: "var(--surface)", color: voiceOn ? "var(--brand-strong)" : "var(--text-muted)", boxShadow: "var(--shadow)" }} aria-label="Toggle voice">{voiceOn ? <IconVoice size={20} /> : <IconMute size={20} />}</button>
          </div>

          <div className="absolute bottom-32 left-4 z-20 flex flex-col items-center rounded-full px-4 py-2.5" style={{ background: "var(--surface)", boxShadow: "var(--shadow)" }}>
            <span className="font-display text-2xl font-extrabold leading-none">{speed}</span>
            <span className="text-[0.6rem]" style={{ color: "var(--text-muted)" }}>km/h</span>
          </div>

          <div className="absolute inset-x-0 bottom-0 z-20 mx-auto max-w-md p-4">
            <div className="rounded-2xl border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-lg)" }}>
              {next ? (
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl text-lg font-extrabold" style={{ background: `${sevColor(next.h.severity)}22`, color: sevColor(next.h.severity) }}>{typeLabel(next.h.type).charAt(0)}</span>
                  <div className="flex-1"><div className="font-semibold">{typeLabel(next.h.type)} detected</div><div className="text-xs capitalize" style={{ color: "var(--text-muted)" }}>{Math.round(next.dist)} m ahead · {next.h.severity} severity</div></div>
                </div>
              ) : (route?.hazards.length ?? 0) === 0 ? (
                <div className="flex items-center justify-center gap-2 text-sm font-semibold" style={{ color: "var(--brand-strong)" }}>
                  <IconCheck size={16} /> Shortest hazard-free route · drive smooth
                </div>
              ) : (
                <div className="text-center text-sm" style={{ color: "var(--text-muted)" }}>{route?.hazards.length} hazards mapped on your route · drive safe</div>
              )}
            </div>
          </div>
        </>
      )}
    </main>
  );
}
