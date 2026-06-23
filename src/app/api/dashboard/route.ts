import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Best-effort area name for a hotspot (Ola reverse geocode). Falls back to null.
async function areaName(lat: number, lng: number): Promise<string | null> {
  const key = process.env.OLA_MAPS_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(
      `https://api.olamaps.io/places/v1/reverse-geocode?latlng=${lat},${lng}&api_key=${key}`,
      {
        headers: { "X-Request-Id": `raahi-${Date.now()}` },
        signal: AbortSignal.timeout(2500),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const r = data?.results?.[0];
    const comp = r?.address_components?.find(
      (c: { types?: string[]; short_name?: string; long_name?: string }) =>
        c.types?.some((t) =>
          ["sublocality", "locality", "neighborhood"].includes(t)
        )
    );
    return (
      comp?.long_name ??
      comp?.short_name ??
      (r?.formatted_address ? String(r.formatted_address).split(",")[0] : null)
    );
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const stats = await db.query(
      `select count(*)::int as total,
              count(*) filter (where severity='high')::int   as high,
              count(*) filter (where severity='medium')::int as medium,
              count(*) filter (where severity='low')::int    as low
       from hazards where status = 'active'`
    );

    const byType = await db.query(
      `select type, count(*)::int as count
       from hazards where status = 'active'
       group by type order by count desc`
    );

    // Cluster active hazards (DBSCAN, ~330m radius, min 2 points) and rank by
    // a priority score = sum of severity weights. This is the hotspot engine.
    const clusters = await db.query(
      `with c as (
         select severity, location,
           ST_ClusterDBSCAN(location::geometry, eps := 0.003, minpoints := 2)
             over () as cid
         from hazards where status = 'active'
       )
       select count(*)::int as count,
              ST_Y(ST_Centroid(ST_Collect(location::geometry))) as lat,
              ST_X(ST_Centroid(ST_Collect(location::geometry))) as lng,
              sum(case severity when 'high' then 3
                                when 'medium' then 2 else 1 end)::int as score
       from c
       where cid is not null
       group by cid
       order by score desc
       limit 6`
    );

    const hotspots = await Promise.all(
      clusters.rows.map(async (h) => ({
        count: h.count,
        score: h.score,
        lat: h.lat,
        lng: h.lng,
        name: (await areaName(h.lat, h.lng)) ?? `Hotspot (${h.count} hazards)`,
      }))
    );

    return NextResponse.json({
      stats: stats.rows[0],
      byType: byType.rows,
      hotspots,
    });
  } catch (err) {
    console.error("dashboard failed:", err);
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}
