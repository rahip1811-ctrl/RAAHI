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
  { value: "debris", label: "Debris" },
  { value: "construction", label: "Construction / dig-up" },
];

// Dot colour = severity (the only thing the map encodes).
function sevColor(s: string) {
  return s === "high" ? "#ef4444" : s === "medium" ? "#f59e0b" : "#22c55e";
}

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
  const hazardMarkersRef = useRef<maplibregl.Marker[]>([]);

  const [reportMode, setReportMode] = useState(false);
  const [draft, setDraft] = useState<{ lng: number; lat: number } | null>(null);
  const [type, setType] = useState("pothole");
  const [severity, setSeverity] = useState("medium");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [myUid, setMyUid] = useState<string | null>(null);
  const [myIsAdmin, setMyIsAdmin] = useState(false);
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
  const [comments, setComments] = useState<
    {
      id: string;
      body: string;
      author: string;
      created_at: string;
      user_id: string | null;
    }[]
  >([]);
  const [newComment, setNewComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState("");

  useEffect(() => {
    reportModeRef.current = reportMode;
  }, [reportMode]);

  // Know whether the visitor is logged in (gates reporting).
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        setLoggedIn(!!d.user);
        setMyUid(d.user?.uid ?? null);
        setMyIsAdmin(!!d.user?.is_admin);
      })
      .catch(() => {});
  }, []);

  // Load comments whenever a different hazard is opened.
  useEffect(() => {
    const id = selected?.id;
    if (!id) {
      setComments([]);
      return;
    }
    let active = true;
    fetch(`/api/hazards/${id}/comments`)
      .then((r) => r.json())
      .then((d) => {
        if (active) setComments(d.comments ?? []);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [selected?.id]);

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
        // Bail if this map instance was replaced/removed (dev hot-reload).
        if (mapRef.current !== map) return;

        // Clear previous hazard markers.
        hazardMarkersRef.current.forEach((m) => m.remove());
        hazardMarkersRef.current = [];

        const now = Date.now();
        for (const h of hazards) {
          const created = h.created_at
            ? new Date(h.created_at).getTime()
            : now;
          const ageDays = Math.max(0, (now - created) / 86400000);
          // Fade as it goes un-confirmed: full at <=3 days, faint by 7.
          const opacity =
            ageDays <= 3 ? 1 : Math.max(0.4, 1 - ((ageDays - 3) / 4) * 0.6);

          // Marker = type icon inside a severity-colored ring.
          const el = document.createElement("div");
          el.style.width = "15px";
          el.style.height = "15px";
          el.style.borderRadius = "50%";
          el.style.background = sevColor(h.severity);
          el.style.border = "1.5px solid #0f172a";
          el.style.boxShadow = "0 1px 3px rgba(0,0,0,0.4)";
          el.style.cursor = "pointer";
          el.style.opacity = String(opacity);
          el.addEventListener("click", (ev) => {
            ev.stopPropagation();
            if (reportModeRef.current) return;
            setSelected({
              id: h.id,
              type: h.type,
              severity: h.severity,
              owned: sessionReportsRef.current.has(h.id),
              lng: h.lng,
              lat: h.lat,
              photoUrl: h.photo_url ? h.photo_url : null,
              reportCount: Number(h.report_count) || 1,
            });
          });

          const marker = new maplibregl.Marker({ element: el })
            .setLngLat([h.lng, h.lat])
            .addTo(map);
          hazardMarkersRef.current.push(marker);
        }
      } catch (err) {
        console.error("Failed to load hazards:", err);
      } finally {
        setLoading(false);
      }
    }
    reloadRef.current = loadHazards;

    map.on("load", () => {
      loadHazards();
    });

    // Tap anywhere while in report mode -> set the draft location.
    map.on("click", (e) => {
      if (reportModeRef.current) {
        setDraft({ lng: e.lngLat.lng, lat: e.lngLat.lat });
      }
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

  async function postComment() {
    if (!selected || !newComment.trim()) return;
    setPostingComment(true);
    try {
      const res = await fetch(`/api/hazards/${selected.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: newComment.trim() }),
      });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) throw new Error("failed");
      const data = await res.json();
      setComments((c) => [...c, data.comment]);
      setNewComment("");
    } catch (err) {
      console.error(err);
      alert("Couldn't post comment. Please try again.");
    } finally {
      setPostingComment(false);
    }
  }

  async function saveEditComment(id: string) {
    const text = editCommentText.trim();
    if (!text) return;
    try {
      const res = await fetch(`/api/comments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      if (res.status === 403) {
        alert("You can only edit your own comments.");
        return;
      }
      if (!res.ok) throw new Error("failed");
      setComments((cs) =>
        cs.map((c) => (c.id === id ? { ...c, body: text } : c))
      );
      setEditingCommentId(null);
      setEditCommentText("");
    } catch (err) {
      console.error(err);
      alert("Couldn't update the comment.");
    }
  }

  async function deleteComment(id: string) {
    if (!window.confirm("Delete this comment?")) return;
    try {
      const res = await fetch(`/api/comments/${id}`, { method: "DELETE" });
      if (res.status === 403) {
        alert("You can only delete your own comments.");
        return;
      }
      if (!res.ok) throw new Error("failed");
      setComments((cs) => cs.filter((c) => c.id !== id));
    } catch (err) {
      console.error(err);
      alert("Couldn't delete the comment.");
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
        <div className="absolute bottom-28 left-1/2 z-20 flex -translate-x-1/2 flex-wrap items-center justify-center gap-3">
          <button
            onClick={toggleWarnings}
            className="btn-press rounded-full px-5 py-3 font-semibold shadow-lg"
            style={
              warningsOn
                ? { background: "var(--danger)", color: "#fff" }
                : { background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)" }
            }
          >
            {warningsOn ? "Stop warnings" : "Start warnings"}
          </button>
          <button
            onClick={startReport}
            className="btn-press rounded-full px-5 py-3 font-semibold shadow-lg"
            style={{ background: "var(--brand)", color: "var(--brand-ink)" }}
          >
            + Report a hazard
          </button>
        </div>
      )}

      {reportMode && (
        <div
          className="thin-scroll absolute inset-x-0 bottom-0 z-30 mx-auto max-h-[80vh] max-w-lg overflow-y-auto rounded-t-2xl border-t px-4 pt-4 pb-28"
          style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)", boxShadow: "var(--shadow-lg)" }}
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="font-display text-base font-bold">{draft ? "New hazard here" : "Report a hazard"}</span>
            <button onClick={cancelReport} aria-label="Cancel" className="btn-press flex h-8 w-8 items-center justify-center rounded-full" style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
          </div>
          {!draft ? (
            <div className="space-y-3">
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Tap the spot on the map where the hazard is — or use your current location.
              </p>
              <div className="flex gap-2">
                <button onClick={useMyLocation} className="btn-press rounded-lg px-4 py-2.5 text-sm font-semibold" style={{ background: "var(--brand)", color: "var(--brand-ink)" }}>
                  Use my location
                </button>
                <button onClick={cancelReport} className="rounded-lg border px-4 py-2.5 text-sm font-semibold" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block text-sm font-medium">
                Type
                <select value={type} onChange={(e) => setType(e.target.value)} className="mt-1 w-full rounded-lg border p-2.5 text-sm" style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }}>
                  {HAZARD_TYPES.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
                </select>
              </label>
              <label className="block text-sm font-medium">
                Severity
                <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="mt-1 w-full rounded-lg border p-2.5 text-sm" style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>
              <div>
                <span className="block text-sm font-medium">Photo (optional)</span>
                <label className="btn-press mt-1.5 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed p-3 text-sm font-medium" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
                  <input type="file" accept="image/*" capture="environment" onChange={handlePhoto} className="hidden" />
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 8h3l1.5-2h7L17 8h3v11H4Z" /><circle cx="12" cy="13" r="3.2" /></svg>
                  {uploading ? "Uploading…" : photoUrl ? "Change photo" : "Take or upload photo"}
                </label>
                {photoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoUrl} alt="hazard" className="mt-2 h-28 w-full rounded-xl object-cover" />
                )}
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={submitReport} disabled={submitting || uploading} className="btn-press flex-1 rounded-lg px-4 py-2.5 font-semibold disabled:opacity-60" style={{ background: "var(--brand)", color: "var(--brand-ink)" }}>
                  {submitting ? "Saving…" : "Submit hazard"}
                </button>
                <button onClick={cancelReport} className="rounded-lg border px-4 py-2.5 font-semibold" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
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

              {/* Comments */}
              <div className="border-t border-zinc-800 pt-3">
                <p className="mb-2 text-xs font-semibold text-zinc-400">
                  Comments
                </p>
                <div className="max-h-32 space-y-2 overflow-auto">
                  {comments.length === 0 && (
                    <p className="text-xs text-zinc-500">
                      No comments yet — add local context.
                    </p>
                  )}
                  {comments.map((c) => {
                    const canModify =
                      myIsAdmin || (!!myUid && c.user_id === myUid);
                    return (
                      <div key={c.id} className="text-sm">
                        {editingCommentId === c.id ? (
                          <div className="flex gap-2">
                            <input
                              value={editCommentText}
                              onChange={(e) => setEditCommentText(e.target.value)}
                              className="flex-1 rounded bg-zinc-800 px-2 py-1 text-sm outline-none"
                            />
                            <button
                              onClick={() => saveEditComment(c.id)}
                              className="text-xs font-semibold text-amber-400"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingCommentId(null)}
                              className="text-xs text-zinc-500"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="font-medium text-amber-300">
                                {c.author}
                              </span>{" "}
                              <span className="text-zinc-300">{c.body}</span>
                            </div>
                            {canModify && (
                              <div className="flex shrink-0 gap-2 text-xs text-zinc-500">
                                <button
                                  onClick={() => {
                                    setEditingCommentId(c.id);
                                    setEditCommentText(c.body);
                                  }}
                                  className="hover:text-white"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => deleteComment(c.id)}
                                  className="hover:text-red-400"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {loggedIn ? (
                  <div className="mt-2 flex gap-2">
                    <input
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") postComment();
                      }}
                      placeholder="Add a comment…"
                      className="flex-1 rounded-lg bg-zinc-800 px-3 py-1.5 text-sm outline-none"
                    />
                    <button
                      onClick={postComment}
                      disabled={postingComment}
                      className="rounded-lg bg-amber-400 px-3 py-1.5 text-sm font-semibold text-zinc-950 hover:bg-amber-300 disabled:opacity-60"
                    >
                      Post
                    </button>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-zinc-500">
                    <a href="/login" className="text-amber-400">
                      Log in
                    </a>{" "}
                    to comment.
                  </p>
                )}
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
