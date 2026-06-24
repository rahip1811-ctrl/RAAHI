import { NextResponse } from "next/server";
import { db } from "@/lib/db";

function levelFor(reports: number): string {
  if (reports >= 50) return "City Protector";
  if (reports >= 25) return "Road Guardian";
  if (reports >= 10) return "Hazard Hunter";
  if (reports >= 3) return "Reporter";
  return "Newcomer";
}

// GET /api/leaderboard -> contributors ranked by impact, all derived from real data
export async function GET() {
  try {
    const result = await db.query(
      `select u.id,
              coalesce(u.name, split_part(u.email, '@', 1)) as name,
              count(h.id)::int as reports,
              count(h.id) filter (where h.status='resolved')::int as resolved,
              coalesce(sum(greatest(coalesce(h.report_count,1) - 1, 0)), 0)::int as confirmations,
              max(h.last_reported_at) as last_active
       from users u
       join hazards h on h.reporter_id = u.id
       group by u.id, u.name, u.email`
    );

    const leaders = result.rows
      .map((r) => {
        const impact = r.reports * 10 + r.confirmations * 2 + r.resolved * 5;
        return {
          id: r.id,
          name: r.name,
          reports: r.reports,
          resolved: r.resolved,
          confirmations: r.confirmations,
          lastActive: r.last_active,
          impact,
          level: levelFor(r.reports),
        };
      })
      .sort((a, b) => b.impact - a.impact)
      .slice(0, 20);

    return NextResponse.json({ leaders });
  } catch (err) {
    console.error("leaderboard failed:", err);
    return NextResponse.json({ error: "Failed to load leaderboard" }, { status: 500 });
  }
}
