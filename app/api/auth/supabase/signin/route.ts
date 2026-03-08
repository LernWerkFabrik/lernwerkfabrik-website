import { NextRequest, NextResponse } from "next/server";

import {
  createSupabaseAnonServerClientAsync,
  createSupabaseServiceRoleClientAsync,
  isSupabaseConfiguredServerAsync,
} from "@/lib/supabase/server";
import {
  encodeStoredSupabaseSession,
  SUPABASE_SESSION_COOKIE,
  toAuthSession,
  toStoredSupabaseSession,
} from "@/lib/auth/providers/supabaseSession";

type SigninRequestBody = {
  email?: unknown;
  password?: unknown;
};

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function withSessionCookie(payload: unknown, storedSession: ReturnType<typeof toStoredSupabaseSession>) {
  const response = NextResponse.json(payload);
  response.cookies.set(SUPABASE_SESSION_COOKIE, encodeStoredSupabaseSession(storedSession), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(storedSession.expiresAt),
  });
  return response;
}

export async function POST(req: NextRequest) {
  if (!(await isSupabaseConfiguredServerAsync())) {
    return NextResponse.json(
      {
        ok: false,
        error: "Anmeldung ist gerade nicht verfügbar.",
      },
      { status: 503 }
    );
  }

  let body: SigninRequestBody;
  try {
    body = (await req.json()) as SigninRequestBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Ungültiger Request-Body." }, { status: 400 });
  }

  const email = readString(body.email).toLowerCase();
  const password = readString(body.password);

  if (!email || !password) {
    return NextResponse.json(
      { ok: false, error: "Bitte E-Mail und Passwort ausfüllen." },
      { status: 400 }
    );
  }

  const anonClient = await createSupabaseAnonServerClientAsync();
  const serviceClient = await createSupabaseServiceRoleClientAsync();

  const signIn = await anonClient.auth.signInWithPassword({
    email,
    password,
  });

  if (signIn.error || !signIn.data.session || !signIn.data.user) {
    return NextResponse.json(
      { ok: false, error: "Anmeldung fehlgeschlagen." },
      { status: 401 }
    );
  }

  const profile = await serviceClient
    .from("profiles")
    .select("display_name")
    .eq("id", signIn.data.user.id)
    .maybeSingle();

  const displayName =
    profile.data && typeof profile.data.display_name === "string"
      ? profile.data.display_name
      : null;

  const stored = toStoredSupabaseSession(signIn.data.session, displayName);
  const authSession = toAuthSession(stored);

  return withSessionCookie({ ok: true, data: authSession }, stored);
}
