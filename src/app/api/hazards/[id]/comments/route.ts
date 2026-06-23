import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// GET /api/hazards/:id/comments -> all comments on a hazard
export async function GET(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const result = await db.query(
      `select c.id, c.body, c.created_at, c.user_id,
              coalesce(u.name, split_part(u.email, '@', 1), 'Someone') as author
       from comments c
       left join users u on u.id = c.user_id
       where c.hazard_id = $1
       order by c.created_at asc
       limit 100`,
      [id]
    );
    return NextResponse.json({ comments: result.rows });
  } catch (err) {
    console.error("GET comments failed:", err);
    return NextResponse.json({ error: "Failed to load comments" }, { status: 500 });
  }
}

// POST /api/hazards/:id/comments -> add a comment (must be logged in)
export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json(
        { error: "Please log in to comment" },
        { status: 401 }
      );
    }
    const { id } = await ctx.params;
    const { body } = await request.json();
    const text = String(body ?? "").trim();
    if (!text) {
      return NextResponse.json({ error: "Comment is empty" }, { status: 400 });
    }

    const result = await db.query(
      `insert into comments (hazard_id, user_id, body)
       values ($1, $2, $3)
       returning id, body, created_at`,
      [id, session.uid, text.slice(0, 1000)]
    );

    return NextResponse.json(
      {
        comment: {
          ...result.rows[0],
          author: session.name || session.email.split("@")[0],
          user_id: session.uid,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST comment failed:", err);
    return NextResponse.json({ error: "Failed to post comment" }, { status: 500 });
  }
}
