import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, setSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!email || !password || String(password).length < 6) {
      return NextResponse.json(
        { error: "Email and a password of 6+ characters are required" },
        { status: 400 }
      );
    }

    const hash = await hashPassword(String(password));

    let result;
    try {
      result = await db.query(
        `insert into users (name, email, password_hash)
         values ($1, $2, $3)
         returning id, name, email`,
        [name ? String(name) : null, String(email).toLowerCase(), hash]
      );
    } catch (e) {
      // 23505 = unique violation (email already exists)
      if ((e as { code?: string }).code === "23505") {
        return NextResponse.json(
          { error: "That email is already registered" },
          { status: 409 }
        );
      }
      throw e;
    }

    const u = result.rows[0];
    await setSessionCookie({ uid: u.id, email: u.email, name: u.name ?? "" });
    return NextResponse.json({ user: u }, { status: 201 });
  } catch (err) {
    console.error("signup failed:", err);
    return NextResponse.json({ error: "Signup failed" }, { status: 500 });
  }
}
