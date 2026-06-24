import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// POST /api/hazards/:id/resolve   -> mark a hazard resolved (persisted)
// POST /api/hazards/:id/resolve { reopen: true } -> set back to active
export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Please log in" }, { status: 401 });
    }
    const { id } = await ctx.params;
    let reopen = false;
    try {
      const body = await request.json();
      reopen = !!body?.reopen;
    } catch {
      /* no body */
    }

    const result = reopen
      ? await db.query(
          `update hazards set status='active', resolved_at=null
           where id=$1 returning id, status`,
          [id]
        )
      : await db.query(
          `update hazards set status='resolved', resolved_at=now()
           where id=$1 returning id, status`,
          [id]
        );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, hazard: result.rows[0] });
  } catch (err) {
    console.error("POST /api/hazards/[id]/resolve failed:", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
