import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// Can this session modify the comment? (Owner, or an admin.)
async function canModify(
  commentUserId: string | null,
  sessionUid: string
): Promise<boolean> {
  if (commentUserId && commentUserId === sessionUid) return true;
  const r = await db.query(`select is_admin from users where id = $1`, [
    sessionUid,
  ]);
  return !!r.rows[0]?.is_admin;
}

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }
    const { id } = await ctx.params;
    const { body } = await request.json();
    const text = String(body ?? "").trim();
    if (!text) {
      return NextResponse.json({ error: "Comment is empty" }, { status: 400 });
    }

    const found = await db.query(`select user_id from comments where id = $1`, [
      id,
    ]);
    if (found.rowCount === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (!(await canModify(found.rows[0].user_id, session.uid))) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    const r = await db.query(
      `update comments set body = $1 where id = $2
       returning id, body, created_at, user_id`,
      [text.slice(0, 1000), id]
    );
    return NextResponse.json({ comment: r.rows[0] });
  } catch (err) {
    console.error("PATCH comment failed:", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }
    const { id } = await ctx.params;

    const found = await db.query(`select user_id from comments where id = $1`, [
      id,
    ]);
    if (found.rowCount === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (!(await canModify(found.rows[0].user_id, session.uid))) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    await db.query(`delete from comments where id = $1`, [id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE comment failed:", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
