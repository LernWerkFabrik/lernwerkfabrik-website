import posthog from "posthog-js";

export type WaitlistEventName =
  | "waitlist_page_view"
  | "waitlist_submit_success"
  | "waitlist_duplicate_email"
  | "waitlist_doi_confirmed";

type PublicPostHogEnv = {
  NEXT_PUBLIC_POSTHOG_HOST?: string;
  NEXT_PUBLIC_POSTHOG_KEY?: string;
};

type WaitlistEventProperties = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    __LWF_PUBLIC_ENV__?: PublicPostHogEnv;
    __lwfPostHogEnabled?: boolean;
  }
}

function normalizePublicValue(value: string | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

export function readPostHogPublicConfig() {
  const runtimeEnv = typeof window !== "undefined" ? window.__LWF_PUBLIC_ENV__ : undefined;

  return {
    key:
      normalizePublicValue(process.env.NEXT_PUBLIC_POSTHOG_KEY) ||
      normalizePublicValue(runtimeEnv?.NEXT_PUBLIC_POSTHOG_KEY),
    host:
      normalizePublicValue(process.env.NEXT_PUBLIC_POSTHOG_HOST) ||
      normalizePublicValue(runtimeEnv?.NEXT_PUBLIC_POSTHOG_HOST),
  };
}

export function setPostHogEnabled(enabled: boolean) {
  if (typeof window === "undefined") return;
  window.__lwfPostHogEnabled = enabled;
}

export function captureWaitlistEvent(
  name: WaitlistEventName,
  properties?: WaitlistEventProperties
) {
  if (typeof window === "undefined" || window.__lwfPostHogEnabled !== true) {
    return;
  }

  try {
    if (properties) {
      void posthog.capture(name, properties);
      return;
    }

    void posthog.capture(name);
  } catch {
    // ignore analytics failures
  }
}
