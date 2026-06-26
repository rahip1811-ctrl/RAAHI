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
const SEVERITY_WEIGHT: Record<string, number> = { high: 3, medium: 2, low: 1 };

type RouteHazard = { id: string; type: string; severity: string; lat: number; lng: number; dist_from_start: number };
type OlaLeg = { distance?: unknown; duration?: unknown; steps?: unknown[] };
type OlaRoute = { overview_polyline?: string | { points?: string }; legs?: OlaLeg[] };

async function hazardsOnLine(latlng: [number, number][], originLat: number, originLng: number): Promise<RouteHazard[]> {
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
      [wkt, originLng, originLat, 80]
    );
    return q.rows as RouteHazard[];
  } catch (e) {
    console.error("route hazard query failed:", e);
    return [];
  }
}

function hazardScore(hazards: RouteHazard[]): number {
  return hazards.reduce((sum, h) => sum + (SEVERITY_WEIGHT[h.severity] ?? 1), 0);
}

export async function POST(request: Request) {
  try {
    const { origin, destination } = await request.json();
    if (!origin || !destination || !Number.isFinite(origin.lat) || !Number.isFinite(destination.lat)) {
      return NextResponse.json({ error: "origin and destination required" }, { status: 400 });
    }
    const key = process.env.OLA_MAPS_API_KEY;
    if (!key) return NextResponse.json({ error: "Routing not configured" }, { status: 500 });

    // alternatives=true asks Ola for more than one route option, when one exists,
    // so we can compare them and pick the one with the fewest/lightest hazards.
    const url = `https://api.olamaps.io/routing/v1/directions?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&alternatives=true&api_key=${key}`;
    const res = await fetch(url, { method: "POST", headers: { "X-Request-Id": `raahi-${Date.now()}` } });
    if (!res.ok) {
      console.error("Ola directions HTTP", res.status);
      return NextResponse.json({ error: "Could not fetch a route" }, { status: 502 });
    }
    const data = await res.json();
    const routes: OlaRoute[] = Array.isArray(data?.routes) ? data.routes : [];
    if (routes.length === 0) {
      return NextResponse.json({ error: "No route found" }, { status: 502 });
    }

    // Decode every alternative Ola gave us.
    const candidates = routes.map((r, i) => {
      const encoded = typeof r.overview_polyline === "string" ? r.overview_polyline : r.overview_polyline?.points ?? "";
      const decoded = encoded ? decodePolyline(encoded) : [];
      const latlng: [number, number][] =
        decoded.length > 1 ? decoded : [[origin.lat, origin.lng], [destination.lat, destination.lng]];
      const distance = (r.legs ?? []).reduce((a, l) => a + numVal(l.distance), 0);
      const duration = (r.legs ?? []).reduce((a, l) => a + numVal(l.duration), 0);
      return { index: i, route: r, latlng, distance, duration };
    });

    // Run the hazard-on-route check against every candidate, in parallel.
    const withHazards = await Promise.all(
      candidates.map(async (c) => ({ ...c, hazards: await hazardsOnLine(c.latlng, origin.lat, origin.lng) }))
    );

    // Pick the lowest hazard score; tie-break on shorter duration (Ola's own ranking).
    // This is Option A: we only ever choose among Ola's own alternatives — we never
    // force an arbitrary detour beyond what Ola itself offers as a route option.
    let best = withHazards[0];
    for (const c of withHazards.slice(1)) {
      const bestScore = hazardScore(best.hazards);
      const score = hazardScore(c.hazards);
      if (score < bestScore || (score === bestScore && c.duration < best.duration)) best = c;
    }

    // How many hazards did we dodge by not picking Ola's first/default route?
    const defaultRoute = withHazards[0];
    const avoidedHazards = Math.max(0, defaultRoute.hazards.length - best.hazards.length);
    const tookAlternateRoute = best.index !== 0 && avoidedHazards > 0;

    const coordinates = best.latlng.map(([la, ln]) => [ln, la]); // [lng, lat] for MapLibre

    const steps: { instruction: string; distance: number; lat: number; lng: number }[] = [];
    for (const leg of best.route.legs ?? []) {
      for (const s of leg.steps ?? []) {
        const step = s as { instructions?: string; maneuver?: string; name?: string; distance?: unknown; start_location?: { lat: number; lng: number }; end_location?: { lat: number; lng: number } };
        const loc = step.start_location ?? step.end_location ?? { lat: 0, lng: 0 };
        steps.push({
          instruction: stripHtml(step.instructions ?? step.maneuver ?? step.name ?? ""),
          distance: numVal(step.distance),
          lat: loc.lat ?? 0,
          lng: loc.lng ?? 0,
        });
      }
    }

    return NextResponse.json({
      coordinates,
      steps,
      hazards: best.hazards,
      distance: best.distance,
      duration: best.duration,
      alternativesConsidered: withHazards.length,
      avoidedHazards,
      tookAlternateRoute,
    });
  } catch (err) {
    console.error("directions failed:", err);
    return NextResponse.json({ error: "Failed to get directions" }, { status: 500 });
  }
}