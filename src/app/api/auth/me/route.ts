import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/auth/me -> { user } (with is_admin) if logged in, else { user: null }
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ user: null });

  let is_admin = false;
  try {
    const r = await db.query(`select is_admin from users where id = $1`, [
      user.uid,
    ]);
    is_admin = !!r.rows[0]?.is_admin;
  } catch {
    /* default false */
  }

  return NextResponse.json({ user: { ...user, is_admin } });
}
