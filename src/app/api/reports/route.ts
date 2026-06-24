import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { areaName } from "@/lib/geo";

export async function GET() {
  try {
    const rows = await db.query(
      `select h.id, h.type, h.severity, h.status, h.photo_url,
              coalesce(h.report_count, 1)::int as report_count, h.created_at,
              ST_Y(location::geometry) as lat, ST_X(location::geometry) as lng,
              (select count(*)::int from comments c where c.hazard_id = h.id) as comments
       from hazards h
       order by h.created_at desc
       limit 30`
    );

    const reports = await Promise.all(
      rows.rows.map(async (r) => ({
        ...r,
        location: (await areaName(r.lat, r.lng)) ?? "Ahmedabad",
      }))
    );

    const sum = await db.query(
      `select count(*) filter (where status='active')::int as active,
              count(*) filter (where created_at >= date_trunc('day', now()))::int as today,
              count(*) filter (where status='active' and severity='high')::int as critical,
              count(*) filter (where coalesce(report_count,1) > 1)::int as verified,
              count(*)::int as total
       from hazards`
    );
    const s = sum.rows[0];
    const verifiedRate = s.total ? Math.round((s.verified / s.total) * 100) : 0;

    return NextResponse.json({
      reports,
      summary: { active: s.active, today: s.today, critical: s.critical, verifiedRate },
    });
  } catch (err) {
    console.error("reports failed:", err);
    return NextResponse.json({ error: "Failed to load reports" }, { status: 500 });
  }
}
