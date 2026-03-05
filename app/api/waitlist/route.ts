import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

type WaitlistBody = {
  email?: unknown;
  source?: unknown;
  referrer?: unknown;
  device_type?: unknown;
  country?: unknown;
};

function normalizeEmail(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase();
}

function normalizeText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

function normalizeCountry(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(trimmed)) return null;
  return trimmed;
}

function createSupabaseWaitlistClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!url || !key) return null;

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function POST(request: NextRequest) {
  let body: WaitlistBody;

  try {
    body = (await request.json()) as WaitlistBody;
  } catch {
    return NextResponse.json(
      { status: "error", message: "invalid_json" },
      { status: 400 }
    );
  }

  const email = normalizeEmail(body.email);
  if (!email || !EMAIL_REGEX.test(email)) {
    return NextResponse.json(
      { status: "error", message: "invalid_email" },
      { status: 400 }
    );
  }

  const source = normalizeText(body.source, 120) || "direct";
  const referrer = normalizeText(body.referrer, 1024) || "direct";
  const deviceType = normalizeText(body.device_type, 32);
  const country = normalizeCountry(body.country);

  const supabase = createSupabaseWaitlistClient();
  if (!supabase) {
    return NextResponse.json(
      {
        status: "error",
        message:
          "missing_supabase_env",
      },
      { status: 500 }
    );
  }

  const insertResult = await supabase
    .from("waitlist")
    .insert({
      email,
      source,
      referrer,
      device_type: deviceType,
      country,
    })
    .select("waitlist_position")
    .single();

  if (insertResult.error) {
    if (insertResult.error.code === "23505") {
      const existing = await supabase
        .from("waitlist")
        .select("waitlist_position")
        .eq("email", email)
        .maybeSingle();

      return NextResponse.json({
        status: "already_registered",
        waitlist_position: existing.data?.waitlist_position ?? null,
      });
    }

    return NextResponse.json(
      {
        status: "error",
        message: "insert_failed",
        details: insertResult.error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    status: "ok",
    waitlist_position: insertResult.data?.waitlist_position ?? null,
  });
}
