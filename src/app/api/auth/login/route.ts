import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, setSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const result = await db.query(
      `select id, name, email, password_hash from users where email = $1`,
      [String(email).toLowerCase()]
    );
    const u = result.rows[0];

    if (!u || !u.password_hash || !(await verifyPassword(String(password), u.password_hash))) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    await setSessionCookie({ uid: u.id, email: u.email, name: u.name ?? "" });
    return NextResponse.json({ user: { id: u.id, name: u.name, email: u.email } });
  } catch (err) {
    console.error("login failed:", err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
