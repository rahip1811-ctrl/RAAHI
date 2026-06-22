import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { setSessionCookie } from "@/lib/auth";

// GET /api/auth/google/callback?code=...&state=...
export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const jar = await cookies();
  const savedState = jar.get("g_state")?.value;

  // Verify the state matches (CSRF check)
  if (!code || !state || state !== savedState) {
    return NextResponse.redirect(`${origin}/login?error=oauth_state`);
  }

  try {
    const redirectUri = `${origin}/api/auth/google/callback`;

    // 1) Exchange the authorization code for tokens (server-to-server).
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID ?? "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    const tokens = await tokenRes.json();
    if (!tokens.access_token) {
      console.error("Google token exchange failed:", tokens);
      return NextResponse.redirect(`${origin}/login?error=oauth_token`);
    }

    // 2) Fetch the user's Google profile.
    const profRes = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      { headers: { Authorization: `Bearer ${tokens.access_token}` } }
    );
    const profile = await profRes.json();
    if (!profile.email) {
      return NextResponse.redirect(`${origin}/login?error=oauth_profile`);
    }

    // 3) Create the user if new, or find the existing one (by email).
    const result = await db.query(
      `insert into users (name, email)
       values ($1, $2)
       on conflict (email) do update set name = coalesce(excluded.name, users.name)
       returning id, name, email`,
      [profile.name ?? null, String(profile.email).toLowerCase()]
    );
    const u = result.rows[0];

    // 4) Log them in.
    await setSessionCookie({ uid: u.id, email: u.email, name: u.name ?? "" });

    const res = NextResponse.redirect(`${origin}/map`);
    res.cookies.delete("g_state");
    return res;
  } catch (err) {
    console.error("Google callback failed:", err);
    return NextResponse.redirect(`${origin}/login?error=oauth`);
  }
}
