"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const START = { lng: 72.5714, lat: 23.0225, zoom: 11 };

type Hazard = {
  id: string;
  lng: number;
  lat: number;
  type: string;
  severity: string;
  photo_url?: string | null;
};

function sevColor(s: string) {
  return s === "high" ? "#ef4444" : s === "medium" ? "#f59e0b" : "#22c55e";
}

export default function DashboardMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;
    const OLA_KEY = process.env.NEXT_PUBLIC_OLA_MAPS_API_KEY;

    const map = new maplibregl.Map({
      container: containerRef.current,
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
              },
            },
            layers: [{ id: "osm", type: "raster", source: "osm" }],
          },
      center: [START.lng, START.lat],
      zoom: START.zoom,
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

    map.on("error", (e) => {
      const m = (e && e.error && e.error.message) || "";
      if (m.includes("3d_model")) return;
      console.error("map error:", e?.error ?? e);
    });

    map.on("load", async () => {
      try {
        const res = await fetch("/api/hazards");
        const data = await res.json();
        const hazards: Hazard[] = data.hazards ?? [];
        if (mapRef.current !== map) return;

        // 1) Heatmap (density), warm danger gradient.
        map.addSource("hz", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: hazards.map((h) => ({
              type: "Feature" as const,
              geometry: { type: "Point" as const, coordinates: [h.lng, h.lat] },
              properties: { severity: h.severity },
            })),
          },
        });
        map.addLayer({
          id: "heat",
          type: "heatmap",
          source: "hz",
          paint: {
            "heatmap-weight": [
              "match",
              ["get", "severity"],
              "high",
              1,
              "medium",
              0.6,
              "low",
              0.3,
              0.5,
            ],
            // Green (light) -> yellow -> orange -> red (dense), like the reference.
            "heatmap-color": [
              "interpolate",
              ["linear"],
              ["heatmap-density"],
              0,
              "rgba(0,0,0,0)",
              0.1,
              "rgba(0,150,70,0.45)",
              0.3,
              "rgba(130,190,30,0.62)",
              0.5,
              "rgba(230,195,30,0.78)",
              0.7,
              "rgba(235,135,30,0.9)",
              0.9,
              "rgba(210,45,35,0.97)",
              1,
              "rgba(150,15,25,1)",
            ],
            "heatmap-radius": 46,
            "heatmap-intensity": 1.25,
            "heatmap-opacity": 0.9,
          },
        });

        // 2) Real photo thumbnails on top. Hazards without a photo are shown by
        //    the heatmap glow only — no dot markers.
        for (const h of hazards) {
          if (!h.photo_url) continue;
          const el = document.createElement("div");
          el.style.width = "44px";
          el.style.height = "44px";
          el.style.borderRadius = "8px";
          el.style.backgroundImage = `url(${h.photo_url})`;
          el.style.backgroundSize = "cover";
          el.style.backgroundPosition = "center";
          el.style.border = `2px solid ${sevColor(h.severity)}`;
          el.style.boxShadow = "0 1px 5px rgba(0,0,0,0.45)";
          el.style.cursor = "pointer";
          el.addEventListener("click", () => {
            new maplibregl.Popup({ maxWidth: "240px" })
              .setLngLat([h.lng, h.lat])
              .setHTML(
                `<img src="${h.photo_url}" alt="" style="width:100%;border-radius:8px;display:block" />
                 <div style="font-family:sans-serif;margin-top:6px;font-weight:600;text-transform:capitalize">
                   ${h.type.replace("_", " ")} · ${h.severity}
                 </div>`
              )
              .addTo(map);
          });
          new maplibregl.Marker({ element: el })
            .setLngLat([h.lng, h.lat])
            .addTo(map);
        }
      } catch (err) {
        console.error("dashboard map load failed:", err);
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className="h-full w-full" />;
}
