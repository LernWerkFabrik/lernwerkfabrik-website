import { NextRequest, NextResponse } from "next/server";

import { normalizeDisplayNameInput, validateDisplayName } from "@/lib/displayName";
import { decodeStoredSupabaseSession, SUPABASE_SESSION_COOKIE } from "@/lib/auth/providers/supabaseSession";
import { createSupabaseServiceRoleClientAsync, isSupabaseConfiguredServerAsync } from "@/lib/supabase/server";

type CompleteProfileBody = {
  displayName?: unknown;
  job?: unknown;
};

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(req: NextRequest) {
  if (!(await isSupabaseConfiguredServerAsync())) {
    return NextResponse.json(
      {
        ok: false,
        error: "Profilservice ist gerade nicht verfügbar.",
      },
      { status: 503 }
    );
  }

  const cookieRaw = req.cookies.get(SUPABASE_SESSION_COOKIE)?.value;
  const stored = cookieRaw ? decodeStoredSupabaseSession(cookieRaw) : null;
  const userId = stored?.user?.id;
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Nicht angemeldet." }, { status: 401 });
  }

  let body: CompleteProfileBody;
  try {
    body = (await req.json()) as CompleteProfileBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Ungültiger Request-Body." }, { status: 400 });
  }

  const displayName = normalizeDisplayNameInput(readString(body.displayName));
  const job = readString(body.job);

  const displayNameValidationError = validateDisplayName(displayName);
  if (displayNameValidationError) {
    return NextResponse.json({ ok: false, error: displayNameValidationError }, { status: 400 });
  }

  const serviceClient = await createSupabaseServiceRoleClientAsync();
  const upsert = await serviceClient.from("profiles").upsert(
    {
      id: userId,
      display_name: displayName,
      job: job || null,
      display_name_changed_at: new Date().toISOString(),
    },
    {
      onConflict: "id",
    }
  );

  if (upsert.error) {
    if (upsert.error.code === "23505") {
      return NextResponse.json({ ok: false, error: "Anzeigename ist bereits vergeben." }, { status: 409 });
    }
    return NextResponse.json(
      { ok: false, error: "Profil konnte nicht vervollständigt werden." },
      { status: 503 }
    );
  }

  return NextResponse.json({ ok: true, data: true });
}
