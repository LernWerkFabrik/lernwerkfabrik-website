import { NextRequest, NextResponse } from "next/server";

import { getTurnstileSecretKeyServerAsync, getTurnstileSiteKeyServerAsync } from "@/lib/turnstile/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const [siteKey, secretKey] = await Promise.all([
    getTurnstileSiteKeyServerAsync(),
    getTurnstileSecretKeyServerAsync(),
  ]);

  return NextResponse.json(
    {
      checkedAt: new Date().toISOString(),
      request: {
        url: request.url,
        host: request.headers.get("host"),
      },
      siteKey: {
        source: siteKey.source,
        present: Boolean(siteKey.value),
        matchedName: siteKey.matchedName,
        length: siteKey.value.length,
      },
      secretKey: {
        source: secretKey.source,
        present: Boolean(secretKey.value),
        matchedName: secretKey.matchedName,
        length: secretKey.value.length,
      },
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
