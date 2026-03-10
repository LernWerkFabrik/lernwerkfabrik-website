import { NextRequest, NextResponse } from "next/server";

import { sendWaitlistDoiEmail } from "@/lib/resend/server";
import { createSupabaseServiceRoleClientAsync } from "@/lib/supabase/server";
import { getTurnstileSecretKeyServerAsync } from "@/lib/turnstile/server";
import { generateWaitlistConfirmationToken } from "@/lib/waitlist/server";

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

type WaitlistRow = {
  id: string;
  email: string;
  status: "pending" | "confirmed" | null;
  confirmation_token: string | null;
  confirmed_position: number | null;
  waitlist_position: number | null;
};

type PendingSubmissionPayload = {
  email: string;
  source: string;
  campaign: string | null;
  referrer: string;
  device_type: string | null;
  country: string | null;
};

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServiceRoleClientAsync>>;

function buildPendingDuplicateMeta(isDuplicate: boolean) {
  if (!isDuplicate) {
    return {};
  }

  return {
    duplicate: true,
    duplicate_status: "pending" as const,
  };
}

function buildAlreadyRegisteredResponse(
  row: Pick<WaitlistRow, "confirmed_position" | "waitlist_position">
) {
  return NextResponse.json({
    status: "already_registered",
    waitlist_position: normalizeConfirmedPosition(row),
    duplicate: true,
    duplicate_status: "confirmed" as const,
  });
}

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

function getRequestProtocol(request: NextRequest) {
  const forwardedProto = request.headers.get("x-forwarded-proto")?.trim().toLowerCase();
  if (forwardedProto === "http" || forwardedProto === "https") {
    return forwardedProto;
  }

  const cfVisitor = request.headers.get("cf-visitor");
  if (cfVisitor) {
    try {
      const parsed = JSON.parse(cfVisitor) as { scheme?: string };
      if (parsed.scheme === "http" || parsed.scheme === "https") {
        return parsed.scheme;
      }
    } catch {
      // ignore malformed cf-visitor header
    }
  }

  return request.nextUrl.protocol.replace(":", "");
}

function getPublicBaseUrl(request: NextRequest) {
  const protocol = getRequestProtocol(request);
  const forwardedHost = request.headers.get("x-forwarded-host")?.trim();
  const host = forwardedHost || request.headers.get("host")?.trim() || request.nextUrl.host;
  return `${protocol}://${host}`;
}

function buildWaitlistConfirmUrl(request: NextRequest, token: string) {
  return new URL(`/waitlist/confirm?token=${encodeURIComponent(token)}`, getPublicBaseUrl(request)).toString();
}

function normalizeConfirmedPosition(row: Pick<WaitlistRow, "confirmed_position" | "waitlist_position">) {
  return row.confirmed_position ?? row.waitlist_position ?? null;
}

function getEffectiveWaitlistStatus(row: Pick<WaitlistRow, "status">) {
  return row.status === "pending" ? "pending" : "confirmed";
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

async function sendPendingConfirmationEmail(params: {
  supabaseServer: SupabaseServerClient;
  request: NextRequest;
  email: string;
  source: string;
  campaign: string | null;
  referrer: string;
  device_type: string | null;
  country: string | null;
  existingPendingId?: string;
  existingConfirmationToken?: string | null;
  isDuplicate?: boolean;
}) {
  const confirmationToken = params.existingPendingId
    ? params.existingConfirmationToken || generateWaitlistConfirmationToken()
    : generateWaitlistConfirmationToken();
  const confirmationSentAt = new Date().toISOString();
  const confirmUrl = buildWaitlistConfirmUrl(params.request, confirmationToken);

  if (params.existingPendingId) {
    const updateResult = await params.supabaseServer
      .from("waitlist")
      .update({
        source: params.source,
        campaign: params.campaign,
        referrer: params.referrer,
        device_type: params.device_type,
        country: params.country,
        confirmation_token: confirmationToken,
        confirmation_sent_at: confirmationSentAt,
      })
      .eq("id", params.existingPendingId)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();

    if (updateResult.error) {
      console.error("waitlist: pending resend update failed", {
        id: params.existingPendingId,
        email: params.email,
        code: updateResult.error.code,
        message: updateResult.error.message,
      });
      return NextResponse.json(
        {
          status: "error",
          message: "service_unavailable",
          ...buildPendingDuplicateMeta(Boolean(params.isDuplicate)),
        },
        { status: 503 }
      );
    }

    if (!updateResult.data?.id) {
      console.error("waitlist: pending resend lost pending state", {
        id: params.existingPendingId,
        email: params.email,
      });
      return NextResponse.json(
        {
          status: "error",
          message: "service_unavailable",
          ...buildPendingDuplicateMeta(Boolean(params.isDuplicate)),
        },
        { status: 503 }
      );
    }
  } else {
    const insertResult = await params.supabaseServer
      .from("waitlist")
      .insert({
        email: params.email,
        source: params.source,
        campaign: params.campaign,
        referrer: params.referrer,
        device_type: params.device_type,
        country: params.country,
        status: "pending",
        confirmation_token: confirmationToken,
        confirmation_sent_at: confirmationSentAt,
      })
      .select("id")
      .single();

    if (insertResult.error) {
      if (insertResult.error.code === "23505") {
        return null;
      }

      console.error("waitlist: pending insert failed", {
        email: params.email,
        code: insertResult.error.code,
        message: insertResult.error.message,
      });
      return NextResponse.json({ status: "error", message: "service_unavailable" }, { status: 503 });
    }
  }

  const mailResult = await sendWaitlistDoiEmail({
    waitlistEmail: params.email,
    confirmUrl,
  });

  if (!mailResult.ok) {
    console.error("waitlist: pending entry stored but confirmation mail failed", {
      email: params.email,
      pendingId: params.existingPendingId ?? null,
      reason: mailResult.reason,
    });

    return NextResponse.json(
      {
        status: "error",
        message: "confirmation_mail_failed",
        ...buildPendingDuplicateMeta(Boolean(params.isDuplicate)),
      },
      { status: 503 }
    );
  }

  return NextResponse.json({
    status: "pending_confirmation",
    ...buildPendingDuplicateMeta(Boolean(params.isDuplicate)),
  });
}

export async function POST(request: NextRequest) {
  let body: WaitlistBody;
  let supabaseServer: SupabaseServerClient;

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

  const submission: PendingSubmissionPayload = {
    email,
    source: normalizeText(body.source, 120) || "direct",
    campaign: normalizeText(body.campaign, 160),
    referrer: normalizeText(body.referrer, 1024) || "direct",
    device_type: normalizeText(body.device_type, 32),
    country: normalizeCountry(body.country),
  };

  const existingResult = await supabaseServer
    .from("waitlist")
    .select("id, email, status, confirmation_token, confirmed_position, waitlist_position")
    .eq("email", email)
    .maybeSingle();

  if (existingResult.error) {
    console.error("waitlist: existing lookup failed", {
      email,
      code: existingResult.error.code,
      message: existingResult.error.message,
    });
    return NextResponse.json({ status: "error", message: "service_unavailable" }, { status: 503 });
  }

  if (existingResult.data?.id) {
    const existingRow = existingResult.data as WaitlistRow;
    const existingStatus = getEffectiveWaitlistStatus(existingRow);

    if (existingStatus === "confirmed") {
      return buildAlreadyRegisteredResponse(existingRow);
    }

    const pendingResponse = await sendPendingConfirmationEmail({
      supabaseServer,
      request,
      existingPendingId: existingRow.id,
      existingConfirmationToken: existingRow.confirmation_token,
      isDuplicate: true,
      ...submission,
    });

    if (pendingResponse) {
      return pendingResponse;
    }

    const refreshedResult = await supabaseServer
      .from("waitlist")
      .select("id, email, status, confirmation_token, confirmed_position, waitlist_position")
      .eq("email", email)
      .maybeSingle();

    if (refreshedResult.error) {
      console.error("waitlist: existing refresh failed", {
        email,
        code: refreshedResult.error.code,
        message: refreshedResult.error.message,
      });
      return NextResponse.json({ status: "error", message: "service_unavailable" }, { status: 503 });
    }

    if (refreshedResult.data?.id) {
      const refreshedRow = refreshedResult.data as WaitlistRow;
      const refreshedStatus = getEffectiveWaitlistStatus(refreshedRow);

      if (refreshedStatus === "confirmed") {
        return buildAlreadyRegisteredResponse(refreshedRow);
      }

      return NextResponse.json(
        {
          status: "error",
          message: "service_unavailable",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({ status: "error", message: "service_unavailable" }, { status: 503 });
  }

  const pendingResponse = await sendPendingConfirmationEmail({
    supabaseServer,
    request,
    ...submission,
  });

  if (pendingResponse) {
    return pendingResponse;
  }

  const duplicateAfterInsertResult = await supabaseServer
    .from("waitlist")
    .select("id, email, status, confirmation_token, confirmed_position, waitlist_position")
    .eq("email", email)
    .maybeSingle();

  if (duplicateAfterInsertResult.error) {
    console.error("waitlist: duplicate recovery lookup failed", {
      email,
      code: duplicateAfterInsertResult.error.code,
      message: duplicateAfterInsertResult.error.message,
    });
    return NextResponse.json({ status: "error", message: "service_unavailable" }, { status: 503 });
  }

  if (duplicateAfterInsertResult.data?.id) {
    const duplicateRow = duplicateAfterInsertResult.data as WaitlistRow;
    const duplicateStatus = getEffectiveWaitlistStatus(duplicateRow);

    if (duplicateStatus === "confirmed") {
      return buildAlreadyRegisteredResponse(duplicateRow);
    }

    const resendResponse = await sendPendingConfirmationEmail({
      supabaseServer,
      request,
      existingPendingId: duplicateRow.id,
      existingConfirmationToken: duplicateRow.confirmation_token,
      isDuplicate: true,
      ...submission,
    });

    if (resendResponse) {
      return resendResponse;
    }
  }

  return NextResponse.json({ status: "error", message: "service_unavailable" }, { status: 503 });
}
