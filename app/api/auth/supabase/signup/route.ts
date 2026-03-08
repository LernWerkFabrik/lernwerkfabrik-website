import { NextRequest, NextResponse } from "next/server";

import { normalizeDisplayNameInput, validateDisplayName } from "@/lib/displayName";
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

type SignupRequestBody = {
  email?: unknown;
  password?: unknown;
  displayName?: unknown;
  name?: unknown;
  job?: unknown;
};

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function responseWithSessionCookie(payload: unknown, status: number, storedSession: ReturnType<typeof toStoredSupabaseSession>) {
  const response = NextResponse.json(payload, { status });
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

  let body: SignupRequestBody;
  try {
    body = (await req.json()) as SignupRequestBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Ungültiger Request-Body." }, { status: 400 });
  }

  const email = readString(body.email).toLowerCase();
  const password = readString(body.password);
  const displayNameInput = readString(body.displayName ?? body.name);
  const displayName = normalizeDisplayNameInput(displayNameInput);
  const job = readString(body.job);

  if (!email || !password || !displayName) {
    return NextResponse.json(
      { ok: false, error: "Bitte E-Mail, Passwort und Anzeigename ausfüllen." },
      { status: 400 }
    );
  }
  if (!email.includes("@")) {
    return NextResponse.json({ ok: false, error: "Bitte eine gültige E-Mail-Adresse verwenden." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ ok: false, error: "Passwort muss mindestens 6 Zeichen haben." }, { status: 400 });
  }

  const displayNameValidationError = validateDisplayName(displayName);
  if (displayNameValidationError) {
    return NextResponse.json({ ok: false, error: displayNameValidationError }, { status: 400 });
  }

  const anonClient = await createSupabaseAnonServerClientAsync();
  const serviceClient = await createSupabaseServiceRoleClientAsync();

  const availability = await serviceClient
    .from("profiles")
    .select("id")
    .eq("display_name", displayName)
    .limit(1);

  if (availability.error) {
    return NextResponse.json(
      { ok: false, error: "Anmeldung ist gerade nicht verfügbar." },
      { status: 503 }
    );
  }
  if (Array.isArray(availability.data) && availability.data.length > 0) {
    return NextResponse.json({ ok: false, error: "Anzeigename ist bereits vergeben." }, { status: 409 });
  }

  const signUp = await anonClient.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
        job: job || null,
      },
    },
  });

  if (signUp.error) {
    return NextResponse.json({ ok: false, error: "Registrierung fehlgeschlagen." }, { status: 400 });
  }

  const user = signUp.data.user;
  if (!user?.id) {
    return NextResponse.json(
      { ok: false, error: "Registrierung konnte nicht abgeschlossen werden." },
      { status: 503 }
    );
  }

  const insertProfile = await serviceClient.from("profiles").insert({
    id: user.id,
    display_name: displayName,
    job: job || null,
  });

  if (insertProfile.error) {
    if (insertProfile.error.code === "23505") {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Anzeigename ist bereits vergeben. Konto wurde erstellt, bitte neuen Anzeigenamen wählen und Profil vervollständigen.",
          code: "display_name_taken",
          needsProfileCompletion: true,
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { ok: false, error: "Profil konnte nicht erstellt werden." },
      { status: 503 }
    );
  }

  if (!signUp.data.session) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Konto erstellt. Bitte E-Mail verifizieren und danach anmelden.",
        code: "email_verification_required",
      },
      { status: 202 }
    );
  }

  const stored = toStoredSupabaseSession(signUp.data.session, displayName);
  const authSession = toAuthSession(stored);

  return responseWithSessionCookie({ ok: true, data: authSession }, 200, stored);
}
