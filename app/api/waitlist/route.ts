import { NextRequest, NextResponse } from "next/server";

import { sendWaitlistEmail } from "@/lib/resend/server";
import { createSupabaseServiceRoleClientAsync } from "@/lib/supabase/server";
import { getTurnstileSecretKeyServerAsync } from "@/lib/turnstile/server";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

type WaitlistBody = {
  email?: unknown;
  source?: unknown;
  campaign?: unknown;
  referrer?: unknown;
  device_type?: unknown;
  country?: unknown;
  turnstile_token?: unknown;
};

type TurnstileVerifyResponse = {
  success: boolean;
  "error-codes"?: string[];
};

type WaitlistPositionRow = {
  id: string;
  waitlist_position: number | null;
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

function readRemoteIp(request: NextRequest): string | null {
  const cfConnectingIp = request.headers.get("cf-connecting-ip")?.trim();
  if (cfConnectingIp) return cfConnectingIp;

  const forwardedFor = request.headers.get("x-forwarded-for")?.trim();
  if (!forwardedFor) return null;

  const firstHop = forwardedFor.split(",")[0]?.trim();
  return firstHop || null;
}

async function verifyTurnstileToken(token: string, remoteIp: string | null) {
  const secretResolution = await getTurnstileSecretKeyServerAsync();
  const secret = secretResolution.value;
  if (!secret) {
    return {
      ok: false,
      reason: "missing_turnstile_secret" as const,
      source: secretResolution.source,
    };
  }

  const formData = new URLSearchParams();
  formData.set("secret", secret);
  formData.set("response", token);
  if (remoteIp) formData.set("remoteip", remoteIp);

  let response: Response;
  try {
    response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData,
    });
  } catch (error) {
    return {
      ok: false,
      reason: "turnstile_request_failed" as const,
      errors: [error instanceof Error ? error.message : "unknown_error"],
    };
  }

  const payload = (await response.json().catch(() => null)) as TurnstileVerifyResponse | null;
  if (!response.ok || !payload?.success) {
    return {
      ok: false,
      reason: "turnstile_verification_failed" as const,
      errors: payload?.["error-codes"] ?? [],
    };
  }

  return { ok: true } as const;
}

async function resolveWaitlistPosition(
  supabaseServer: Awaited<ReturnType<typeof createSupabaseServiceRoleClientAsync>>,
  insertedId: string,
  currentPosition: number | null
) {
  const rowsResult = await supabaseServer
    .from("waitlist")
    .select("id, waitlist_position")
    .order("waitlist_position", { ascending: true })
    .order("id", { ascending: true });

  if (rowsResult.error) {
    console.error("waitlist: position select failed", {
      code: rowsResult.error.code,
      message: rowsResult.error.message,
    });
    return currentPosition;
  }

  const rows = (rowsResult.data ?? []) as WaitlistPositionRow[];
  let targetPosition = 1;

  for (const row of rows) {
    if (row.id === insertedId) {
      continue;
    }

    if (typeof row.waitlist_position !== "number" || row.waitlist_position < targetPosition) {
      continue;
    }

    if (row.waitlist_position === targetPosition) {
      targetPosition += 1;
      continue;
    }

    break;
  }

  if (currentPosition === targetPosition) {
    return currentPosition;
  }

  const updateResult = await supabaseServer
    .from("waitlist")
    .update({ waitlist_position: targetPosition })
    .eq("id", insertedId);

  if (updateResult.error) {
    console.error("waitlist: position update failed", {
      id: insertedId,
      target: targetPosition,
      code: updateResult.error.code,
      message: updateResult.error.message,
    });
    return currentPosition;
  }

  return targetPosition;
}

export async function POST(request: NextRequest) {
  let body: WaitlistBody;
  let supabaseServer: Awaited<ReturnType<typeof createSupabaseServiceRoleClientAsync>>;

  try {
    supabaseServer = await createSupabaseServiceRoleClientAsync();
  } catch {
    return NextResponse.json({ status: "error", message: "service_unavailable" }, { status: 503 });
  }

  try {
    body = (await request.json()) as WaitlistBody;
  } catch {
    return NextResponse.json({ status: "error", message: "invalid_json" }, { status: 400 });
  }

  const email = normalizeEmail(body.email);
  if (!email || !EMAIL_REGEX.test(email)) {
    return NextResponse.json({ status: "error", message: "invalid_email" }, { status: 400 });
  }

  const turnstileToken = normalizeText(body.turnstile_token, 4096);
  if (!turnstileToken) {
    return NextResponse.json(
      { status: "error", message: "missing_turnstile_token" },
      { status: 400 }
    );
  }

  const verification = await verifyTurnstileToken(turnstileToken, readRemoteIp(request));
  if (!verification.ok) {
    console.error("waitlist: turnstile verification failed", {
      reason: verification.reason,
      source: "source" in verification ? verification.source : undefined,
      errors: "errors" in verification ? verification.errors : [],
    });

    if (verification.reason === "turnstile_verification_failed") {
      return NextResponse.json(
        {
          status: "error",
          message: "turnstile_verification_failed",
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        status: "error",
        message: "service_unavailable",
      },
      { status: 503 }
    );
  }

  const source = normalizeText(body.source, 120) || "direct";
  const campaign = normalizeText(body.campaign, 160);
  const referrer = normalizeText(body.referrer, 1024) || "direct";
  const deviceType = normalizeText(body.device_type, 32);
  const country = normalizeCountry(body.country);

  const existingBeforeInsert = await supabaseServer
    .from("waitlist")
    .select("id, waitlist_position")
    .eq("email", email)
    .maybeSingle();

  if (existingBeforeInsert.error) {
    console.error("waitlist: existing lookup failed", {
      code: existingBeforeInsert.error.code,
      message: existingBeforeInsert.error.message,
    });
    return NextResponse.json({ status: "error", message: "service_unavailable" }, { status: 503 });
  }

  if (existingBeforeInsert.data?.id) {
    return NextResponse.json({
      status: "already_registered",
      waitlist_position: existingBeforeInsert.data.waitlist_position ?? null,
    });
  }

  const insertResult = await supabaseServer
    .from("waitlist")
    .insert({
      email,
      source,
      campaign,
      referrer,
      device_type: deviceType,
      country,
    })
    .select("id, waitlist_position")
    .single();

  if (insertResult.error) {
    if (insertResult.error.code === "23505") {
      const existing = await supabaseServer
        .from("waitlist")
        .select("waitlist_position")
        .eq("email", email)
        .maybeSingle();

      return NextResponse.json({
        status: "already_registered",
        waitlist_position: existing.data?.waitlist_position ?? null,
      });
    }

    console.error("waitlist: insert failed", {
      code: insertResult.error.code,
      message: insertResult.error.message,
    });
    return NextResponse.json({ status: "error", message: "service_unavailable" }, { status: 503 });
  }

  const resolvedPosition = insertResult.data?.id
    ? await resolveWaitlistPosition(
        supabaseServer,
        insertResult.data.id,
        insertResult.data.waitlist_position ?? null
      )
    : null;

  const finalPosition = resolvedPosition ?? insertResult.data?.waitlist_position ?? null;

  const mailResult = await sendWaitlistEmail({
    waitlistEmail: email,
    waitlistPosition: finalPosition,
  });

  if (!mailResult.ok) {
    console.error("waitlist: resend mail skipped", {
      email,
      waitlistPosition: finalPosition,
      reason: mailResult.reason,
    });
  }

  return NextResponse.json({
    status: "ok",
    waitlist_position: finalPosition,
  });
}
