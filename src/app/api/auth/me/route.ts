import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

// GET /api/auth/me -> { user } if logged in, else { user: null }
export async function GET() {
  const user = await getSessionUser();
  return NextResponse.json({ user });
}
