import posthog from "posthog-js";

export type WaitlistEventName =
  | "waitlist_page_view"
  | "waitlist_submit_success"
  | "waitlist_duplicate_email"
  | "waitlist_doi_confirmed";

type WaitlistEventProperties = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    __lwfPostHogEnabled?: boolean;
  }
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
