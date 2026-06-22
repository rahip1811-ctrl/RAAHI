"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const START = { lng: 72.5714, lat: 23.0225, zoom: 12 };

type Suggestion = {
  description: string;
  mainText: string;
  secondaryText: string;
  lat: number | null;
  lng: number | null;
};

const HAZARD_TYPES = [
  { value: "pothole", label: "Pothole" },
  { value: "open_drain", label: "Open drain" },
  { value: "waterlogging", label: "Waterlogging" },
  { value: "debris", label: "Debris" },
];

type Hazard = {
  id: string;
  type: string;
  severity: "low" | "medium" | "high";
  lat: number;
  lng: number;
  photo_url?: string | null;
  report_count?: number;
  last_reported_at?: string;
  created_at?: string;
};

// Shrink a photo in the browser before upload (a pothole pic doesn't need 8MB).
async function shrinkImage(file: File, maxDim = 1280, quality = 0.7): Promise<Blob> {
  const dataUrl: string = await new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
  const img: HTMLImageElement = await new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = dataUrl;
  });
  let { width, height } = img;
  if (width > height && width > maxDim) {
    height = Math.round((height * maxDim) / width);
    width = maxDim;
  } else if (height > maxDim) {
    width = Math.round((width * maxDim) / height);
    height = maxDim;
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")?.drawImage(img, 0, 0, width, height);
  return new Promise((res, rej) =>
    canvas.toBlob(
      (b) => (b ? res(b) : rej(new Error("toBlob failed"))),
      "image/jpeg",
      quality
    )
  );
}

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
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
  // IDs of hazards reported in THIS browser session (so only you can edit/delete them).
  const sessionReportsRef = useRef<Set<string>>(new Set());
  const [selected, setSelected] = useState<{
    id: string;
    type: string;
    severity: string;
    owned: boolean;
    lng: number;
    lat: number;
    photoUrl: string | null;
    reportCount: number;
  } | null>(null);
  const [editing, setEditing] = useState(false);
  const [editType, setEditType] = useState("pothole");
  const [editSeverity, setEditSeverity] = useState("medium");

  useEffect(() => {
    reportModeRef.current = reportMode;
  }, [reportMode]);

  // Know whether the visitor is logged in (gates reporting).
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setLoggedIn(!!d.user))
      .catch(() => {});
  }, []);

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

    const OLA_KEY = process.env.NEXT_PUBLIC_OLA_MAPS_API_KEY;

    const map = new maplibregl.Map({
      container: containerRef.current,
      // Use Ola Maps' India-rich vector tiles if a key is present; otherwise
      // fall back to free OpenStreetMap raster tiles.
      style: OLA_KEY
        ? "https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json"
        : {
            version: 8,
            sources: {
              osm: {
                type: "raster",
                tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
                tileSize: 256,
                maxzoom: 19,
                attribution: "© OpenStreetMap contributors",
              },
            },
            layers: [{ id: "osm", type: "raster", source: "osm" }],
          },
      center: [START.lng, START.lat],
      zoom: START.zoom,
      // Ola requires the api_key on every tile/style/sprite/glyph request.
      transformRequest: (url: string) => {
        if (OLA_KEY && url.includes("olamaps.io")) {
          const u = new URL(url);
          if (!u.searchParams.has("api_key"))
            u.searchParams.set("api_key", OLA_KEY);
          return { url: u.toString() };
        }
        return { url };
      },
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl(), "top-right");

    // The Ola style references a "3d_model" layer not in the free tiles —
    // harmless. Swallow that one warning, still log any real errors.
    map.on("error", (e) => {
      const msg = (e && e.error && e.error.message) || "";
      if (msg.includes("3d_model")) return;
      console.error("map error:", e?.error ?? e);
    });

    // Load ALL active hazards once. Simple and snappy for current data volumes.
    async function loadHazards() {
      setLoading(true);
      try {
        const res = await fetch(`/api/hazards`);
        const data = await res.json();
        const hazards: Hazard[] = data.hazards ?? [];
        const now = Date.now();
        const features = hazards.map((h) => {
          const created = h.created_at
            ? new Date(h.created_at).getTime()
            : now;
          const ageDays = Math.max(0, (now - created) / 86400000);
          return {
            type: "Feature" as const,
            geometry: { type: "Point" as const, coordinates: [h.lng, h.lat] },
            properties: {
              id: h.id,
              type: h.type,
              severity: h.severity,
              lng: h.lng,
              lat: h.lat,
              photo_url: h.photo_url ?? "",
              report_count: h.report_count ?? 1,
              age_days: ageDays,
            },
          };
        });
        // Bail if this map instance was replaced/removed (dev hot-reload).
        if (mapRef.current !== map) return;
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
          // Fade hazards as they go un-confirmed: bright at <=3 days, faint by 7.
          "circle-opacity": [
            "interpolate",
            ["linear"],
            ["get", "age_days"],
            3,
            1,
            7,
            0.3,
          ],
          "circle-stroke-opacity": [
            "interpolate",
            ["linear"],
            ["get", "age_days"],
            3,
            1,
            7,
            0.3,
          ],
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

    // Tap a dot (when NOT reporting) -> open the details panel.
    map.on("click", "hazard-points", (e) => {
      if (reportModeRef.current) return;
      const f = e.features?.[0];
      if (!f) return;
      const p = (f.properties ?? {}) as {
        id?: string;
        type?: string;
        severity?: string;
        lng?: number;
        lat?: number;
        photo_url?: string;
        report_count?: number;
      };
      if (!p.id) return;
      setSelected({
        id: p.id,
        type: p.type ?? "",
        severity: p.severity ?? "",
        owned: sessionReportsRef.current.has(p.id),
        lng: Number(p.lng),
        lat: Number(p.lat),
        photoUrl: p.photo_url ? p.photo_url : null,
        reportCount: Number(p.report_count) || 1,
      });
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
    if (draft && Number.isFinite(draft.lng) && Number.isFinite(draft.lat)) {
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
    if (!loggedIn) {
      router.push("/login");
      return;
    }
    setReportMode(true);
    setDraft(null);
  }
  function cancelReport() {
    setReportMode(false);
    setDraft(null);
    setPhotoUrl(null);
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
  function onSearchChange(value: string) {
    setQuery(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (value.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    // Debounce: wait 300ms after the last keystroke before asking the server.
    searchTimerRef.current = setTimeout(async () => {
      try {
        const c = mapRef.current?.getCenter();
        const loc = c ? `&lat=${c.lat}&lng=${c.lng}` : "";
        const res = await fetch(
          `/api/places?input=${encodeURIComponent(value)}${loc}`
        );
        const data = await res.json();
        setSuggestions(data.suggestions ?? []);
      } catch (err) {
        console.error("search failed:", err);
      }
    }, 300);
  }

  function selectSuggestion(s: Suggestion) {
    setSuggestions([]);
    setQuery(s.description);
    if (s.lat == null || s.lng == null) return;
    mapRef.current?.flyTo({ center: [s.lng, s.lat], zoom: 16 });
    // If we're reporting, drop the pin there so the user can fine-tune.
    if (reportModeRef.current) setDraft({ lng: s.lng, lat: s.lat });
  }

  async function handlePhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const shrunk = await shrinkImage(file);
      const form = new FormData();
      form.append("file", shrunk, "photo.jpg");
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (!res.ok) throw new Error("upload failed");
      const data = await res.json();
      setPhotoUrl(data.url);
    } catch (err) {
      console.error(err);
      alert("Couldn't upload the photo. You can still submit without it.");
    } finally {
      setUploading(false);
    }
  }

  async function submitReport() {
    if (!draft) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/hazards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          severity,
          lat: draft.lat,
          lng: draft.lng,
          photo_url: photoUrl,
        }),
      });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) throw new Error("save failed");
      const data = await res.json();
      if (data?.hazard?.id) sessionReportsRef.current.add(data.hazard.id);
      if (data?.duplicate) {
        alert(
          "Thanks! A hazard was already reported at this spot — we counted yours as a confirmation."
        );
      }
      setReportMode(false);
      setDraft(null);
      setPhotoUrl(null);
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

  function openEdit() {
    if (!selected) return;
    setEditType(selected.type);
    setEditSeverity(selected.severity);
    setDraft(null); // no location change unless they choose to move it
    setEditing(true);
  }
  function startMove() {
    if (!selected) return;
    if (!Number.isFinite(selected.lng) || !Number.isFinite(selected.lat)) return;
    setDraft({ lng: selected.lng, lat: selected.lat });
    mapRef.current?.flyTo({ center: [selected.lng, selected.lat], zoom: 16 });
  }
  async function saveEdit() {
    if (!selected) return;
    try {
      const res = await fetch(`/api/hazards/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: editType,
          severity: editSeverity,
          // include new coords only if the user moved the pin
          ...(draft ? { lat: draft.lat, lng: draft.lng } : {}),
        }),
      });
      if (!res.ok) throw new Error("update failed");
      setEditing(false);
      setSelected(null);
      setDraft(null);
      reloadRef.current();
    } catch (err) {
      console.error(err);
      alert("Could not update. Please try again.");
    }
  }
  async function deleteSelected() {
    if (!selected) return;
    if (!window.confirm("Delete this hazard?")) return;
    try {
      const res = await fetch(`/api/hazards/${selected.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const info = await res.json().catch(() => ({}));
        throw new Error(`${res.status}: ${info.error ?? "unknown"}`);
      }
      sessionReportsRef.current.delete(selected.id);
      setSelected(null);
      reloadRef.current();
    } catch (err) {
      console.error(err);
      alert("Could not delete — " + (err as Error).message);
    }
  }

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />

      {/* Search box with live apartment/area autocomplete */}
      <div className="absolute left-1/2 top-16 z-20 w-[min(92%,440px)] -translate-x-1/2">
        <input
          value={query}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search apartment, area or landmark…"
          className="w-full rounded-full bg-white/95 px-4 py-2 text-sm text-zinc-900 shadow outline-none"
        />
        {suggestions.length > 0 && (
          <ul className="mt-1 max-h-72 overflow-auto rounded-xl bg-white shadow-lg">
            {suggestions.map((s, i) => (
              <li key={i}>
                <button
                  onClick={() => selectSuggestion(s)}
                  className="block w-full px-4 py-2 text-left text-sm hover:bg-zinc-100"
                >
                  <span className="font-medium text-zinc-900">{s.mainText}</span>
                  {s.secondaryText && (
                    <span className="block text-xs text-zinc-500">
                      {s.secondaryText}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

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
              <div>
                <label className="block text-sm">
                  Photo (optional)
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhoto}
                    className="mt-1 block w-full text-xs text-zinc-300"
                  />
                </label>
                {uploading && (
                  <p className="mt-1 text-xs text-zinc-400">Uploading photo…</p>
                )}
                {photoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoUrl}
                    alt="hazard"
                    className="mt-2 h-20 w-20 rounded object-cover"
                  />
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={submitReport}
                  disabled={submitting || uploading}
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

      {selected && !reportMode && (
        <div className="absolute inset-x-0 bottom-0 z-20 mx-auto max-w-lg rounded-t-2xl bg-zinc-900/95 p-4 text-white shadow-2xl">
          {!editing ? (
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-lg font-semibold capitalize">
                    {selected.type.replace("_", " ")}
                  </p>
                  <p className="text-sm capitalize text-zinc-400">
                    Severity: {selected.severity}
                  </p>
                  <p className="text-xs text-zinc-500">
                    ✅ Reported by {selected.reportCount}{" "}
                    {selected.reportCount === 1 ? "person" : "people"}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelected(null);
                    setDraft(null);
                  }}
                  className="px-2 text-zinc-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              {selected.photoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selected.photoUrl}
                  alt="hazard"
                  className="max-h-48 w-full rounded-lg object-cover"
                />
              )}
              <div className="flex gap-2">
                <button
                  onClick={openEdit}
                  className="flex-1 rounded-lg bg-zinc-700 px-4 py-2 font-semibold hover:bg-zinc-600"
                >
                  Edit
                </button>
                <button
                  onClick={deleteSelected}
                  className="flex-1 rounded-lg bg-red-600 px-4 py-2 font-semibold hover:bg-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-semibold">Edit hazard</p>
              <label className="block text-sm">
                Type
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value)}
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
                  value={editSeverity}
                  onChange={(e) => setEditSeverity(e.target.value)}
                  className="mt-1 w-full rounded-lg bg-zinc-800 p-2 text-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>
              <button
                onClick={startMove}
                className="w-full rounded-lg bg-zinc-700 px-4 py-2 text-sm font-semibold hover:bg-zinc-600"
              >
                {draft ? "📍 Drag the blue pin on the map to adjust" : "📍 Move location"}
              </button>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={saveEdit}
                  className="flex-1 rounded-lg bg-amber-400 px-4 py-2 font-semibold text-zinc-950 hover:bg-amber-300"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setDraft(null);
                  }}
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
