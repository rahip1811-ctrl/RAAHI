"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const START = { lng: 72.5714, lat: 23.0225, zoom: 12 };

const HAZARD_TYPES = [
  { value: "pothole", label: "Pothole" },
  { value: "open_drain", label: "Open drain" },
  { value: "waterlogging", label: "Waterlogging" },
  { value: "speed_breaker", label: "Speed breaker" },
  { value: "debris", label: "Debris" },
];

type Hazard = {
  id: string;
  type: string;
  severity: "low" | "medium" | "high";
  lat: number;
  lng: number;
};

export default function HazardMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const reloadRef = useRef<() => void>(() => {});
  const reportModeRef = useRef(false);
  const draftMarkerRef = useRef<maplibregl.Marker | null>(null);

  const [reportMode, setReportMode] = useState(false);
  const [draft, setDraft] = useState<{ lng: number; lat: number } | null>(null);
  const [type, setType] = useState("pothole");
  const [severity, setSeverity] = useState("medium");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [warningsOn, setWarningsOn] = useState(false);
  const [nearest, setNearest] = useState<{
    type: string;
    severity: string;
    meters: number;
  } | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const announcedRef = useRef<Set<string>>(new Set());
  const lastFetchRef = useRef<number>(0);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);

  useEffect(() => {
    reportModeRef.current = reportMode;
  }, [reportMode]);

  // Stop GPS tracking & any speech when the component unmounts.
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null)
        navigator.geolocation.clearWatch(watchIdRef.current);
      try {
        window.speechSynthesis?.cancel();
      } catch {
        /* no speech support */
      }
    };
  }, []);

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            maxzoom: 19, // OSM only has tiles up to z19; beyond this, stretch them
            attribution: "© OpenStreetMap contributors",
          },
        },
        layers: [{ id: "osm", type: "raster", source: "osm" }],
      },
      center: [START.lng, START.lat],
      zoom: START.zoom,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl(), "top-right");

    // Load ALL active hazards once. Simple and snappy for current data volumes.
    async function loadHazards() {
      setLoading(true);
      try {
        const res = await fetch(`/api/hazards`);
        const data = await res.json();
        const hazards: Hazard[] = data.hazards ?? [];
        const features = hazards.map((h) => ({
          type: "Feature" as const,
          geometry: { type: "Point" as const, coordinates: [h.lng, h.lat] },
          properties: { id: h.id, type: h.type, severity: h.severity },
        }));
        const source = map.getSource("hazards") as
          | maplibregl.GeoJSONSource
          | undefined;
        source?.setData({ type: "FeatureCollection", features });
      } catch (err) {
        console.error("Failed to load hazards:", err);
      } finally {
        setLoading(false);
      }
    }
    reloadRef.current = loadHazards;

    map.on("load", () => {
      map.addSource("hazards", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "hazard-points",
        type: "circle",
        source: "hazards",
        paint: {
          "circle-radius": 7,
          "circle-color": [
            "match",
            ["get", "severity"],
            "high",
            "#ef4444",
            "medium",
            "#f59e0b",
            "low",
            "#22c55e",
            "#9ca3af",
          ],
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "#0f172a",
        },
      });
      loadHazards();
    });

    // Tap anywhere while in report mode -> set the draft location.
    map.on("click", (e) => {
      if (reportModeRef.current) {
        setDraft({ lng: e.lngLat.lng, lat: e.lngLat.lat });
      }
    });

    // Tap a dot (when NOT reporting) -> details popup.
    map.on("click", "hazard-points", (e) => {
      if (reportModeRef.current) return;
      const f = e.features?.[0];
      if (!f) return;
      const p = (f.properties ?? {}) as { type?: string; severity?: string };
      const coords = (f.geometry as GeoJSON.Point).coordinates as [
        number,
        number
      ];
      new maplibregl.Popup({ closeButton: false })
        .setLngLat(coords)
        .setHTML(
          `<div style="font-family:sans-serif">
             <strong style="text-transform:capitalize">${(p.type ?? "").replace(
               "_",
               " "
             )}</strong><br/>severity: <span style="text-transform:capitalize">${
            p.severity ?? ""
          }</span></div>`
        )
        .addTo(map);
    });
    map.on("mouseenter", "hazard-points", () => {
      if (!reportModeRef.current) map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "hazard-points", () => {
      map.getCanvas().style.cursor = "";
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Draggable blue marker for the draft report location.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (draft) {
      if (!draftMarkerRef.current) {
        const m = new maplibregl.Marker({ color: "#2563eb", draggable: true })
          .setLngLat([draft.lng, draft.lat])
          .addTo(map);
        m.on("dragend", () => {
          const ll = m.getLngLat();
          setDraft({ lng: ll.lng, lat: ll.lat });
        });
        draftMarkerRef.current = m;
      } else {
        draftMarkerRef.current.setLngLat([draft.lng, draft.lat]);
      }
    } else {
      draftMarkerRef.current?.remove();
      draftMarkerRef.current = null;
    }
  }, [draft]);

  function startReport() {
    setReportMode(true);
    setDraft(null);
  }
  function cancelReport() {
    setReportMode(false);
    setDraft(null);
  }
  function useMyLocation() {
    if (!navigator.geolocation) {
      alert("Your browser doesn't support location.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setDraft(loc);
        mapRef.current?.flyTo({ center: [loc.lng, loc.lat], zoom: 15 });
      },
      () => alert("Couldn't get your location. You can tap the map instead.")
    );
  }
  async function search(e: FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    try {
      const map = mapRef.current;
      // Bias results toward whatever area is currently on screen.
      let viewbox = "";
      if (map) {
        const b = map.getBounds();
        viewbox = `&viewbox=${b.getWest()},${b.getNorth()},${b.getEast()},${b.getSouth()}`;
      }
      // Add city context if the user didn't include one.
      const q = query.trim();
      const full = /ahmedabad|gujarat/i.test(q) ? q : `${q}, Ahmedabad`;
      // Free OpenStreetMap geocoding (Nominatim).
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=in${viewbox}&q=${encodeURIComponent(
          full
        )}`
      );
      const results = await res.json();
      if (!results.length) {
        alert(
          "Couldn't find that. Try a nearby landmark, road, or area name, then drag the pin to the exact spot."
        );
        return;
      }
      const coords = {
        lat: parseFloat(results[0].lat),
        lng: parseFloat(results[0].lon),
      };
      mapRef.current?.flyTo({ center: [coords.lng, coords.lat], zoom: 16 });
      // If we're reporting, drop the pin there so the user can fine-tune.
      if (reportModeRef.current) setDraft(coords);
    } catch (err) {
      console.error(err);
      alert("Search failed. Please try again.");
    } finally {
      setSearching(false);
    }
  }

  async function submitReport() {
    if (!draft) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/hazards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, severity, lat: draft.lat, lng: draft.lng }),
      });
      if (!res.ok) throw new Error("save failed");
      setReportMode(false);
      setDraft(null);
      reloadRef.current();
    } catch (err) {
      console.error(err);
      alert("Could not save the hazard. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function speak(text: string) {
    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
    } catch {
      /* speech not available */
    }
  }

  // Called repeatedly as the user's GPS position changes.
  async function onPosition(pos: GeolocationPosition) {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    const map = mapRef.current;

    // Keep a blue dot on the user's live position.
    if (map) {
      if (!userMarkerRef.current) {
        userMarkerRef.current = new maplibregl.Marker({ color: "#2563eb" })
          .setLngLat([lng, lat])
          .addTo(map);
      } else {
        userMarkerRef.current.setLngLat([lng, lat]);
      }
    }

    // Only hit the database every 4 seconds, not on every tiny GPS jiggle.
    const now = Date.now();
    if (now - lastFetchRef.current < 4000) return;
    lastFetchRef.current = now;

    try {
      const res = await fetch(`/api/hazards?lat=${lat}&lng=${lng}&radius=400`);
      const data = await res.json();
      const hazards = (data.hazards ?? []) as Array<{
        id: string;
        type: string;
        severity: string;
        distance_m: number;
      }>;
      const within = hazards
        .filter((h) => h.distance_m <= 200)
        .sort((a, b) => a.distance_m - b.distance_m);

      if (within.length === 0) {
        setNearest(null);
        return;
      }
      const closest = within[0];
      setNearest({
        type: closest.type,
        severity: closest.severity,
        meters: Math.round(closest.distance_m),
      });

      // Speak the nearest hazard we haven't announced yet this trip.
      const fresh = within.find((h) => !announcedRef.current.has(h.id));
      if (fresh) {
        announcedRef.current.add(fresh.id);
        speak(
          `Warning. ${fresh.type.replace("_", " ")} ahead. ${Math.round(
            fresh.distance_m
          )} meters.`
        );
      }
    } catch (err) {
      console.error("warning lookup failed:", err);
    }
  }

  function toggleWarnings() {
    if (warningsOn) {
      if (watchIdRef.current !== null)
        navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      announcedRef.current.clear();
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      setNearest(null);
      setWarningsOn(false);
      return;
    }
    if (!navigator.geolocation) {
      alert("Your browser doesn't support location.");
      return;
    }
    setWarningsOn(true);
    speak("Live hazard warnings on."); // also unlocks speech (needs a user tap)
    watchIdRef.current = navigator.geolocation.watchPosition(
      onPosition,
      () => {
        alert("Couldn't track your location. Please allow location access.");
        setWarningsOn(false);
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    );
  }

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />

      {/* Search box: jump to an area, landmark, or address */}
      <form
        onSubmit={search}
        className="absolute left-1/2 top-16 z-20 flex w-[min(92%,440px)] -translate-x-1/2 gap-2"
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search area, landmark or address…"
          className="flex-1 rounded-full bg-white/95 px-4 py-2 text-sm text-zinc-900 shadow outline-none"
        />
        <button
          type="submit"
          disabled={searching}
          className="rounded-full bg-zinc-900/90 px-4 py-2 text-sm font-semibold text-white shadow disabled:opacity-60"
        >
          {searching ? "…" : "Search"}
        </button>
      </form>

      {loading && (
        <div className="absolute left-1/2 top-4 z-20 -translate-x-1/2 rounded-full bg-zinc-900/90 px-4 py-1.5 text-xs text-white shadow">
          Loading hazards…
        </div>
      )}

      {warningsOn && (
        <div
          className={`absolute left-1/2 top-28 z-20 -translate-x-1/2 rounded-xl px-5 py-3 text-center font-semibold shadow-lg ${
            nearest ? "bg-red-600 text-white" : "bg-zinc-900/90 text-zinc-200"
          }`}
        >
          {nearest ? (
            <span>
              ⚠{" "}
              <span className="capitalize">
                {nearest.type.replace("_", " ")}
              </span>{" "}
              · {nearest.meters} m ahead
            </span>
          ) : (
            "Warnings on · scanning the road ahead…"
          )}
        </div>
      )}

      {!reportMode && (
        <div className="absolute bottom-6 right-4 z-20 flex flex-col items-end gap-3">
          <button
            onClick={toggleWarnings}
            className={`rounded-full px-5 py-3 font-semibold shadow-lg ${
              warningsOn
                ? "bg-red-500 text-white hover:bg-red-400"
                : "bg-zinc-900/90 text-white hover:bg-zinc-800"
            }`}
          >
            {warningsOn ? "■ Stop warnings" : "🔊 Start warnings"}
          </button>
          <button
            onClick={startReport}
            className="rounded-full bg-amber-400 px-5 py-3 font-semibold text-zinc-950 shadow-lg hover:bg-amber-300"
          >
            ＋ Report a hazard
          </button>
        </div>
      )}

      {reportMode && (
        <div className="absolute inset-x-0 bottom-0 z-20 mx-auto max-w-lg rounded-t-2xl bg-zinc-900/95 p-4 text-white shadow-2xl">
          {!draft ? (
            <div className="space-y-3">
              <p className="text-sm">
                📍 Tap the spot on the map where the hazard is — or use your
                current location.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={useMyLocation}
                  className="rounded-lg bg-zinc-700 px-4 py-2 text-sm font-semibold hover:bg-zinc-600"
                >
                  Use my location
                </button>
                <button
                  onClick={cancelReport}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-semibold">New hazard here</p>
              <label className="block text-sm">
                Type
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="mt-1 w-full rounded-lg bg-zinc-800 p-2 text-white"
                >
                  {HAZARD_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                Severity
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="mt-1 w-full rounded-lg bg-zinc-800 p-2 text-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={submitReport}
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-amber-400 px-4 py-2 font-semibold text-zinc-950 hover:bg-amber-300 disabled:opacity-60"
                >
                  {submitting ? "Saving…" : "Submit hazard"}
                </button>
                <button
                  onClick={cancelReport}
                  className="rounded-lg px-4 py-2 font-semibold text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
