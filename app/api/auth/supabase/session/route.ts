import { NextRequest, NextResponse } from "next/server";

import { createSupabaseAnonServerClientAsync, isSupabaseConfiguredServerAsync } from "@/lib/supabase/server";
import {
  decodeStoredSupabaseSession,
  encodeStoredSupabaseSession,
  isSupabaseSessionExpired,
  SUPABASE_SESSION_COOKIE,
  toAuthSession,
  toStoredSupabaseSession,
} from "@/lib/auth/providers/supabaseSession";

function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SUPABASE_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
}

export async function GET(req: NextRequest) {
  if (!(await isSupabaseConfiguredServerAsync())) {
    return NextResponse.json(
      {
        ok: false,
        error: "Sitzung ist gerade nicht verfügbar.",
      },
      { status: 503 }
    );
  }

  const cookieValue = req.cookies.get(SUPABASE_SESSION_COOKIE)?.value;
  if (!cookieValue) return NextResponse.json({ ok: true, data: null });

  const decoded = decodeStoredSupabaseSession(cookieValue);
  if (!decoded) {
    const response = NextResponse.json({ ok: true, data: null });
    clearSessionCookie(response);
    return response;
  }

  if (!isSupabaseSessionExpired(decoded.expiresAt)) {
    return NextResponse.json({ ok: true, data: toAuthSession(decoded) });
  }

  if (!decoded.refreshToken) {
    const response = NextResponse.json({ ok: true, data: null });
    clearSessionCookie(response);
    return response;
  }

  const anonClient = await createSupabaseAnonServerClientAsync();
  const refresh = await anonClient.auth.refreshSession({
    refresh_token: decoded.refreshToken,
  });

  if (refresh.error || !refresh.data.session) {
    const response = NextResponse.json({ ok: true, data: null });
    clearSessionCookie(response);
    return response;
  }

  const refreshed = toStoredSupabaseSession(refresh.data.session, decoded.user?.name ?? null);
  const authSession = toAuthSession(refreshed);

  const response = NextResponse.json({ ok: true, data: authSession });
  response.cookies.set(SUPABASE_SESSION_COOKIE, encodeStoredSupabaseSession(refreshed), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(refreshed.expiresAt),
  });
  return response;
}
