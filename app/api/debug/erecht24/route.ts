import { NextResponse } from "next/server";

import { getERecht24ApiKeyDiagnostics, loadERecht24Document } from "@/lib/erecht24";

export const dynamic = "force-dynamic";

export async function GET() {
  const [apiKey, imprint, privacyPolicy] = await Promise.all([
    getERecht24ApiKeyDiagnostics(),
    loadERecht24Document("imprint"),
    loadERecht24Document("privacyPolicy"),
  ]);

  return NextResponse.json(
    {
      checkedAt: new Date().toISOString(),
      apiKey,
      imprint: {
        ok: !imprint.error,
        error: imprint.error || null,
        htmlLength: imprint.html.length,
      },
      privacyPolicy: {
        ok: !privacyPolicy.error,
        error: privacyPolicy.error || null,
        htmlLength: privacyPolicy.html.length,
      },
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
