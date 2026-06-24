import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const totals = await db.query(
      `select count(*) filter (where status='active')::int as active,
              count(*) filter (where status='resolved')::int as resolved,
              count(*) filter (where status='active' and severity='high')::int as high,
              count(*) filter (where status='active' and severity='medium')::int as medium,
              count(*) filter (where status='active' and severity='low')::int as low,
              count(*)::int as all_time
       from hazards`
    );
    const byType = await db.query(
      `select type, count(*)::int as count from hazards where status='active' group by type order by count desc`
    );
    // Cumulative growth over the last 14 days so the chart is always visible.
    const overTime = await db.query(
      `with days as (
         select generate_series(date_trunc('day', now()) - interval '13 days',
                                date_trunc('day', now()), interval '1 day') as d
       )
       select to_char(days.d, 'Mon DD') as day,
              (select count(*)::int from hazards h where h.created_at < days.d + interval '1 day') as reports,
              (select count(*)::int from hazards h where h.status='resolved' and h.created_at < days.d + interval '1 day') as resolved
       from days order by days.d`
    );

    const t = totals.rows[0];
    const denom = (t.active ?? 0) + (t.resolved ?? 0);
    const resolutionRate = denom ? Math.round((t.resolved / denom) * 100) : 0;
    const mostCommon = byType.rows[0]?.type ?? null;

    return NextResponse.json({
      totals: { ...t, allTime: t.all_time, resolutionRate, mostCommon },
      byType: byType.rows,
      severity: [
        { label: "High", value: t.high },
        { label: "Medium", value: t.medium },
        { label: "Low", value: t.low },
      ],
      overTime: overTime.rows,
    });
  } catch (err) {
    console.error("analytics failed:", err);
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 });
  }
}
