import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { areaName } from "@/lib/geo";

export async function GET() {
  try {
    const stats = await db.query(
      `select count(*) filter (where status='active')::int                     as total,
              count(*) filter (where status='active' and severity='high')::int   as high,
              count(*) filter (where status='active' and severity='medium')::int as medium,
              count(*) filter (where status='active' and severity='low')::int    as low,
              count(*) filter (where status='resolved')::int                     as resolved,
              count(*)::int                                                      as all_time
       from hazards`
    );

    const s = stats.rows[0];
    const denom = (s.total ?? 0) + (s.resolved ?? 0);
    const resolutionRate = denom ? Math.round((s.resolved / denom) * 100) : 0;

    const byType = await db.query(
      `select type, count(*)::int as count
       from hazards where status='active'
       group by type order by count desc`
    );

    const clusters = await db.query(
      `with c as (
         select severity, location,
           ST_ClusterDBSCAN(location::geometry, eps := 0.003, minpoints := 2) over () as cid
         from hazards where status='active'
       )
       select count(*)::int as count,
              ST_Y(ST_Centroid(ST_Collect(location::geometry))) as lat,
              ST_X(ST_Centroid(ST_Collect(location::geometry))) as lng,
              sum(case severity when 'high' then 3 when 'medium' then 2 else 1 end)::int as score
       from c where cid is not null
       group by cid order by score desc limit 8`
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
      stats: { total: s.total, high: s.high, medium: s.medium, low: s.low, resolved: s.resolved, allTime: s.all_time, resolutionRate },
      byType: byType.rows,
      hotspots,
    });
  } catch (err) {
    console.error("dashboard failed:", err);
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}
