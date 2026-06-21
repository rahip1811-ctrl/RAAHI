import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const ALLOWED_TYPES = [
  "pothole",
  "open_drain",
  "waterlogging",
  "speed_breaker",
  "debris",
];
const ALLOWED_SEVERITY = ["low", "medium", "high"];

// PATCH /api/hazards/:id  -> update type/severity of a hazard
export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const body = await request.json();
    const { type, severity, lat, lng } = body ?? {};

    if (!ALLOWED_TYPES.includes(type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }
    if (!ALLOWED_SEVERITY.includes(severity)) {
      return NextResponse.json({ error: "Invalid severity" }, { status: 400 });
    }

    // If a new location was provided, move the point too; otherwise leave it.
    const hasLoc = Number.isFinite(lat) && Number.isFinite(lng);

    const result = hasLoc
      ? await db.query(
          `update hazards
             set type = $1, severity = $2,
                 location = ST_SetSRID(ST_MakePoint($3, $4), 4326)
           where id = $5
           returning id, type, severity, status,
                     ST_Y(location::geometry) as lat,
                     ST_X(location::geometry) as lng`,
          [type, severity, lng, lat, id]
        )
      : await db.query(
          `update hazards set type = $1, severity = $2
           where id = $3
           returning id, type, severity, status,
                     ST_Y(location::geometry) as lat,
                     ST_X(location::geometry) as lng`,
          [type, severity, id]
        );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ hazard: result.rows[0] });
  } catch (err) {
    console.error("PATCH /api/hazards/[id] failed:", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

// DELETE /api/hazards/:id  -> remove a hazard (its confirmations/comments
// cascade-delete automatically via the foreign keys)
export async function DELETE(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const result = await db.query(`delete from hazards where id = $1`, [id]);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/hazards/[id] failed:", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
