import posthog from "posthog-js";

import { setPostHogEnabled } from "@/lib/posthog";

const postHogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
const postHogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim();

if (typeof window !== "undefined") {
  if (postHogKey && postHogHost) {
    try {
      posthog.init(postHogKey, {
        api_host: postHogHost,
        autocapture: false,
        capture_pageview: false,
        capture_pageleave: false,
        capture_dead_clicks: false,
        capture_exceptions: false,
        disable_session_recording: true,
        disable_surveys: true,
        enable_heatmaps: false,
        rageclick: false,
        advanced_disable_flags: true,
        person_profiles: "identified_only",
        respect_dnt: true,
      });
      setPostHogEnabled(true);
    } catch {
      setPostHogEnabled(false);
    }
  } else {
    setPostHogEnabled(false);
  }
}
