import "server-only";

import { Resend } from "resend";

import { getWorkerRuntimeEnvAsync } from "@/lib/cloudflare/env";

const RESEND_FROM_EMAIL = "waitlist@mail.lernwerkfabrik.de";
const WAITLIST_TEST_RECIPIENT = "admin@lernwerkfabrik.de";
const WAITLIST_TEST_SUBJECT = "Testmail LernWerkFabrik";
const WAITLIST_TEST_HTML = "<p>Resend mit eigener Domain funktioniert.</p>";

type ResendEnvSource = "cloudflare_binding" | "process_env" | "missing";

type ResendApiKeyResolution = {
  value: string;
  source: ResendEnvSource;
};

function normalizeEnvValue(value: string) {
  let normalized = value.trim();

  if (
    (normalized.startsWith('"') && normalized.endsWith('"')) ||
    (normalized.startsWith("'") && normalized.endsWith("'"))
  ) {
    normalized = normalized.slice(1, -1).trim();
  }

  return normalized;
}

async function getResendApiKeyAsync(): Promise<ResendApiKeyResolution> {
  const runtimeEnv = await getWorkerRuntimeEnvAsync();
  const runtimeValue = runtimeEnv?.RESEND_API_KEY;

  if (typeof runtimeValue === "string") {
    const normalized = normalizeEnvValue(runtimeValue);
    if (normalized) {
      return {
        value: normalized,
        source: "cloudflare_binding",
      };
    }
  }

  const processValue = process.env.RESEND_API_KEY;
  if (typeof processValue === "string") {
    const normalized = normalizeEnvValue(processValue);
    if (normalized) {
      return {
        value: normalized,
        source: "process_env",
      };
    }
  }

  return {
    value: "",
    source: "missing",
  };
}

export async function sendWaitlistEmail(params: {
  waitlistEmail: string;
  waitlistPosition: number | null;
}) {
  const apiKey = await getResendApiKeyAsync();
  if (!apiKey.value) {
    console.error("waitlist: resend api key missing", {
      source: apiKey.source,
    });
    return { ok: false as const, reason: "missing_resend_api_key" as const };
  }

  try {
    const resend = new Resend(apiKey.value);
    const response = await resend.emails.send({
      from: RESEND_FROM_EMAIL,
      to: WAITLIST_TEST_RECIPIENT,
      subject: WAITLIST_TEST_SUBJECT,
      html: WAITLIST_TEST_HTML,
    });

    if (response.error) {
      console.error("waitlist: resend send failed", {
        source: apiKey.source,
        waitlistEmail: params.waitlistEmail,
        waitlistPosition: params.waitlistPosition,
        name: response.error.name,
        message: response.error.message,
      });
      return { ok: false as const, reason: "resend_send_failed" as const };
    }

    return {
      ok: true as const,
      id: response.data?.id ?? null,
    };
  } catch (error) {
    console.error("waitlist: resend request failed", {
      source: apiKey.source,
      waitlistEmail: params.waitlistEmail,
      waitlistPosition: params.waitlistPosition,
      message: error instanceof Error ? error.message : "unknown_error",
    });
    return { ok: false as const, reason: "resend_request_failed" as const };
  }
}
