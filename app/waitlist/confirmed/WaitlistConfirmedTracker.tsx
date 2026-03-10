"use client";

import * as React from "react";

import { captureWaitlistEvent } from "@/lib/posthog";

export default function WaitlistConfirmedTracker({
  status,
}: {
  status: "success" | "invalid" | "error";
}) {
  React.useEffect(() => {
    if (status !== "success") return;
    captureWaitlistEvent("waitlist_doi_confirmed", { status: "confirmed" });
  }, [status]);

  return null;
}
