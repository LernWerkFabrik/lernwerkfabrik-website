import { NextRequest, NextResponse } from "next/server";

import {
  DISPLAY_NAME_MAX_LENGTH,
  DISPLAY_NAME_MIN_LENGTH,
  normalizeDisplayNameInput,
  sanitizeDisplayNameSeed,
  validateDisplayName,
} from "@/lib/displayName";
import { createSupabaseServiceRoleClientAsync, isSupabaseConfiguredServerAsync } from "@/lib/supabase/server";

function withSuffix(base: string, suffixNumber: number): string {
  const suffix = `_${suffixNumber}`;
  const maxBaseLength = Math.max(1, DISPLAY_NAME_MAX_LENGTH - suffix.length);
  const trimmedBase = base.slice(0, maxBaseLength).replace(/[._]+$/g, "");
  return `${trimmedBase}${suffix}`;
}

function normalizeSeed(seed: string): string {
  const cleaned = sanitizeDisplayNameSeed(seed);
  if (cleaned.length >= DISPLAY_NAME_MIN_LENGTH) return cleaned;
  return "azubi";
}

export async function GET(req: NextRequest) {
  if (!(await isSupabaseConfiguredServerAsync())) {
    return NextResponse.json(
      {
        ok: false,
        error: "Dienst ist gerade nicht verfügbar.",
      },
      { status: 503 }
    );
  }

  const params = req.nextUrl.searchParams;
  const rawName = (params.get("name") ?? "").trim();
  const rawSeed = (params.get("seed") ?? "").trim();

  if (!rawName && !rawSeed) {
    return NextResponse.json(
      { ok: false, error: "Entweder 'name' oder 'seed' muss gesetzt sein." },
      { status: 400 }
    );
  }

  const client = await createSupabaseServiceRoleClientAsync();

  if (rawName) {
    const normalized = normalizeDisplayNameInput(rawName);
    const validationError = validateDisplayName(normalized);
    if (validationError) {
      return NextResponse.json({
        ok: true,
        normalized,
        available: false,
        validationError,
      });
    }

    const existing = await client
      .from("profiles")
      .select("id")
      .eq("display_name", normalized)
      .limit(1);

    if (existing.error) {
      return NextResponse.json(
        { ok: false, error: "Display-Name-Check ist gerade nicht verfügbar." },
        { status: 503 }
      );
    }

    return NextResponse.json({
      ok: true,
      normalized,
      available: !existing.data || existing.data.length === 0,
    });
  }

  const seed = normalizeSeed(rawSeed);
  const existing = await client
    .from("profiles")
    .select("display_name")
    .ilike("display_name", `${seed}%`)
    .limit(500);

  if (existing.error) {
    return NextResponse.json(
      { ok: false, error: "Display-Name-Vorschläge sind gerade nicht verfügbar." },
      { status: 503 }
    );
  }

  const used = new Set<string>();
  for (const row of existing.data ?? []) {
    if (row && typeof row.display_name === "string") {
      used.add(normalizeDisplayNameInput(row.display_name));
    }
  }

  if (!used.has(seed)) {
    return NextResponse.json({ ok: true, suggestion: seed });
  }

  for (let i = 1; i <= 9999; i += 1) {
    const candidate = withSuffix(seed, i);
    if (candidate.length < DISPLAY_NAME_MIN_LENGTH) continue;
    if (!used.has(candidate)) {
      return NextResponse.json({ ok: true, suggestion: candidate });
    }
  }

  return NextResponse.json({ ok: true, suggestion: withSuffix(seed, Date.now() % 10000) });
}
