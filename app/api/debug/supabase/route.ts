import { NextRequest, NextResponse } from "next/server";

import {
  createSupabaseServiceRoleClientAsync,
  getSupabaseServerEnvDiagnosticsAsync,
} from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const diagnostics = await getSupabaseServerEnvDiagnosticsAsync();

  let waitlistProbe: {
    ok: boolean;
    count: number | null;
    error: string | null;
  } = {
    ok: false,
    count: null,
    error: null,
  };

  if (diagnostics.missing.length === 0) {
    try {
      const client = await createSupabaseServiceRoleClientAsync();
      const probe = await client.from("waitlist").select("id", { head: true, count: "exact" });

      waitlistProbe = {
        ok: !probe.error,
        count: typeof probe.count === "number" ? probe.count : null,
        error: probe.error ? `${probe.error.code ?? "unknown"}: ${probe.error.message}` : null,
      };
    } catch (error) {
      waitlistProbe = {
        ok: false,
        count: null,
        error: error instanceof Error ? error.message : "probe_failed",
      };
    }
  }

  return NextResponse.json(
    {
      checkedAt: new Date().toISOString(),
      request: {
        url: request.url,
        host: request.headers.get("host"),
      },
      diagnostics,
      waitlistProbe,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
