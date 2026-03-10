import { NextRequest, NextResponse } from "next/server";

import { sendWaitlistAdminEmail } from "@/lib/resend/server";
import { createSupabaseServiceRoleClientAsync } from "@/lib/supabase/server";
import {
  getNextConfirmedWaitlistPosition,
  normalizeWaitlistConfirmationToken,
} from "@/lib/waitlist/server";

function buildStatusRedirect(request: NextRequest, status: "success" | "invalid" | "error") {
  return NextResponse.redirect(new URL(`/waitlist/confirmed?status=${status}`, request.url), 302);
}

export async function GET(request: NextRequest) {
  const token = normalizeWaitlistConfirmationToken(request.nextUrl.searchParams.get("token"));
  if (!token) {
    return buildStatusRedirect(request, "invalid");
  }

  let supabaseServer: Awaited<ReturnType<typeof createSupabaseServiceRoleClientAsync>>;

  try {
    supabaseServer = await createSupabaseServiceRoleClientAsync();
  } catch {
    console.error("waitlist: token confirmation failed", {
      reason: "service_client_unavailable",
    });
    return buildStatusRedirect(request, "error");
  }

  const lookupResult = await supabaseServer
    .from("waitlist")
    .select("id, email, status, confirmed_position")
    .eq("confirmation_token", token)
    .maybeSingle();

  if (lookupResult.error) {
    console.error("waitlist: token confirmation failed", {
      reason: "lookup_failed",
      code: lookupResult.error.code,
      message: lookupResult.error.message,
      tokenPrefix: token.slice(0, 8),
    });
    return buildStatusRedirect(request, "error");
  }

  if (!lookupResult.data?.id || lookupResult.data.status !== "pending") {
    return buildStatusRedirect(request, "invalid");
  }

  const nextPosition = await getNextConfirmedWaitlistPosition(supabaseServer);
  if (typeof nextPosition !== "number" || nextPosition <= 0) {
    console.error("waitlist: token confirmation failed", {
      reason: "confirmed_position_unavailable",
      waitlistId: lookupResult.data.id,
      email: lookupResult.data.email,
    });
    return buildStatusRedirect(request, "error");
  }

  const confirmedAt = new Date().toISOString();
  const confirmResult = await supabaseServer
    .from("waitlist")
    .update({
      status: "confirmed",
      confirmed_at: confirmedAt,
      confirmation_token: null,
      confirmed_position: nextPosition,
    })
    .eq("id", lookupResult.data.id)
    .eq("status", "pending")
    .eq("confirmation_token", token)
    .select("id, email, confirmed_position")
    .maybeSingle();

  if (confirmResult.error) {
    console.error("waitlist: token confirmation failed", {
      reason: "update_failed",
      waitlistId: lookupResult.data.id,
      email: lookupResult.data.email,
      code: confirmResult.error.code,
      message: confirmResult.error.message,
    });
    return buildStatusRedirect(request, "error");
  }

  if (!confirmResult.data?.id) {
    return buildStatusRedirect(request, "invalid");
  }

  const adminMailResult = await sendWaitlistAdminEmail({
    waitlistEmail: confirmResult.data.email,
    waitlistPosition: confirmResult.data.confirmed_position ?? nextPosition,
    receivedAt: confirmedAt,
  });

  if (!adminMailResult.ok) {
    console.error("waitlist: confirmation succeeded but admin mail failed", {
      waitlistId: confirmResult.data.id,
      email: confirmResult.data.email,
      waitlistPosition: confirmResult.data.confirmed_position ?? nextPosition,
      receivedAt: confirmedAt,
      reason: adminMailResult.reason,
    });
  }

  return buildStatusRedirect(request, "success");
}
