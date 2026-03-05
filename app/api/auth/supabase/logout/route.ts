import { NextResponse } from "next/server";

import { SUPABASE_SESSION_COOKIE } from "@/lib/auth/providers/supabaseSession";

export async function POST() {
  const response = NextResponse.json({ ok: true, data: true });
  response.cookies.set(SUPABASE_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
  return response;
}
