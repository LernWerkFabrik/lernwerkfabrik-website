import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ ok: true });

  response.cookies.set("lp_auth_v1", "", {
    path: "/",
    maxAge: 0,
  });

  response.cookies.set("lp_sb_session", "", {
    path: "/",
    maxAge: 0,
  });

  return response;
}
