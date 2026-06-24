import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { areaName } from "@/lib/geo";

export async function GET() {
  try {
    const clusters = await db.query(
      `with c as (
         select severity, status, location,
           ST_ClusterDBSCAN(location::geometry, eps := 0.012, minpoints := 1) over () as cid
         from hazards
       )
       select count(*)::int as reported,
              count(*) filter (where status='resolved')::int as resolved,
              ST_Y(ST_Centroid(ST_Collect(location::geometry))) as lat,
              ST_X(ST_Centroid(ST_Collect(location::geometry))) as lng,
              sum(case severity when 'high' then 3 when 'medium' then 2 else 1 end)::int as score
       from c group by cid order by reported desc limit 6`
    );

    const zones = await Promise.all(
      clusters.rows.map(async (z, i) => {
        const rate = z.reported ? Math.round((z.resolved / z.reported) * 100) : 0;
        return {
          name: (await areaName(z.lat, z.lng)) ?? `Zone ${i + 1}`,
          reported: z.reported,
          resolved: z.resolved,
          rate,
          score: z.score,
          lat: z.lat,
          lng: z.lng,
        };
      })
    );

    return NextResponse.json({ zones });
  } catch (err) {
    console.error("zones failed:", err);
    return NextResponse.json({ error: "Failed to load zones" }, { status: 500 });
  }
}
