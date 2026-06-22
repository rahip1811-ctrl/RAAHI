import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/leaderboard -> top contributors by hazards reported
export async function GET() {
  try {
    const result = await db.query(
      `select u.id,
              coalesce(u.name, split_part(u.email, '@', 1)) as name,
              count(h.id)::int as reports
       from users u
       join hazards h on h.reporter_id = u.id
       group by u.id, u.name, u.email
       order by reports desc
       limit 20`
    );
    return NextResponse.json({ leaders: result.rows });
  } catch (err) {
    console.error("leaderboard failed:", err);
    return NextResponse.json({ error: "Failed to load leaderboard" }, { status: 500 });
  }
}
