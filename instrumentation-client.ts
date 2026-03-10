import posthog from "posthog-js";

import { readPostHogPublicConfig, setPostHogEnabled } from "@/lib/posthog";

if (typeof window !== "undefined") {
  const { key: postHogKey, host: postHogHost } = readPostHogPublicConfig();

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
