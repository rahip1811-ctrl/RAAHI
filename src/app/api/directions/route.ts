import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Decode a Google/Ola encoded polyline -> array of [lat, lng].
function decodePolyline(str: string): [number, number][] {
  let index = 0, lat = 0, lng = 0;
  const coords: [number, number][] = [];
  while (index < str.length) {
    let b: number, shift = 0, result = 0;
    do { b = str.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;
    shift = 0; result = 0;
    do { b = str.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;
    coords.push([lat / 1e5, lng / 1e5]);
  }
  return coords;
}

const stripHtml = (s: string) => String(s).replace(/<[^>]*>/g, "").trim();
const numVal = (v: unknown): number => (typeof v === "number" ? v : (v as { value?: number })?.value ?? 0);

type RouteHazard = { id: string; type: string; severity: string; lat: number; lng: number; dist_from_start: number };

export async function POST(request: Request) {
  try {
    const { origin, destination } = await request.json();
    if (!origin || !destination || !Number.isFinite(origin.lat) || !Number.isFinite(destination.lat)) {
      return NextResponse.json({ error: "origin and destination required" }, { status: 400 });
    }
    const key = process.env.OLA_MAPS_API_KEY;
    if (!key) return NextResponse.json({ error: "Routing not configured" }, { status: 500 });

    const url = `https://api.olamaps.io/routing/v1/directions?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&api_key=${key}`;
    const res = await fetch(url, { method: "POST", headers: { "X-Request-Id": `raahi-${Date.now()}` } });
    if (!res.ok) {
      console.error("Ola directions HTTP", res.status);
      return NextResponse.json({ error: "Could not fetch a route" }, { status: 502 });
    }
    const data = await res.json();
    const route = data?.routes?.[0];

    const encoded =
      typeof route?.overview_polyline === "string"
        ? route.overview_polyline
        : route?.overview_polyline?.points ?? "";
    const decoded = encoded ? decodePolyline(encoded) : [];
    const latlng: [number, number][] =
      decoded.length > 1 ? decoded : [[origin.lat, origin.lng], [destination.lat, destination.lng]];
    const coordinates = latlng.map(([la, ln]) => [ln, la]); // [lng, lat] for MapLibre

    const steps: { instruction: string; distance: number; lat: number; lng: number }[] = [];
    for (const leg of route?.legs ?? []) {
      for (const s of leg.steps ?? []) {
        const loc = s.start_location ?? s.end_location ?? {};
        steps.push({
          instruction: stripHtml(s.instructions ?? s.maneuver ?? s.name ?? ""),
          distance: numVal(s.distance),
          lat: loc.lat ?? 0,
          lng: loc.lng ?? 0,
        });
      }
    }
    const distance = (route?.legs ?? []).reduce((a: number, l: unknown) => a + numVal((l as { distance?: unknown }).distance), 0);
    const duration = (route?.legs ?? []).reduce((a: number, l: unknown) => a + numVal((l as { duration?: unknown }).duration), 0);

    // Hazards lying on the route (PostGIS line proximity).
    let hazards: RouteHazard[] = [];
    try {
      const wkt = `LINESTRING(${latlng.map(([la, ln]) => `${ln} ${la}`).join(", ")})`;
      const q = await db.query(
        `select id, type, severity,
                ST_Y(location::geometry) as lat, ST_X(location::geometry) as lng,
                ST_Distance(location, ST_SetSRID(ST_MakePoint($2,$3),4326)::geography) as dist_from_start
         from hazards
         where status='active'
           and ST_DWithin(location, ST_GeogFromText($1), $4)
         order by dist_from_start`,
        [wkt, origin.lng, origin.lat, 80]
      );
      hazards = q.rows as RouteHazard[];
    } catch (e) {
      console.error("route hazard query failed:", e);
    }

    return NextResponse.json({ coordinates, steps, hazards, distance, duration });
  } catch (err) {
    console.error("directions failed:", err);
    return NextResponse.json({ error: "Failed to get directions" }, { status: 500 });
  }
}
