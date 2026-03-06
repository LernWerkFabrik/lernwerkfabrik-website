import { getCloudflareContext } from "@opennextjs/cloudflare";

const ERECHT24_ENDPOINTS = {
  imprint: "https://api.e-recht24.dev/v2/imprint",
  privacyPolicy: "https://api.e-recht24.dev/v2/privacyPolicy",
} as const;

type ERecht24DocumentType = keyof typeof ERECHT24_ENDPOINTS;

type ERecht24ApiResponse = {
  html_de?: string;
  html_en?: string;
  modified?: string;
  warnings?: string;
};

type ERecht24ApiKeyResolution = {
  apiKey: string;
  source: "cloudflare_binding" | "missing";
};

export type ERecht24LoadResult = {
  html: string;
  modified: string;
  warnings: string;
  error: string;
};

async function resolveERecht24ApiKey(): Promise<ERecht24ApiKeyResolution> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const value = (env as Record<string, unknown>).ERECHT24_API_KEY;

    if (typeof value === "string") {
      const apiKey = value.trim();
      if (apiKey) {
        return {
          apiKey,
          source: "cloudflare_binding",
        };
      }
    }
  } catch {
    // Outside Workers runtime the Cloudflare context may be unavailable.
  }

  return {
    apiKey: "",
    source: "missing",
  };
}

function logApiKeyDiagnostics(document: ERecht24DocumentType, keyResolution: ERecht24ApiKeyResolution) {
  console.info("[eRecht24] API key diagnostics", {
    document,
    source: keyResolution.source,
    present: keyResolution.apiKey.length > 0,
    length: keyResolution.apiKey.length,
  });
}

export async function loadERecht24Document(document: ERecht24DocumentType): Promise<ERecht24LoadResult> {
  const keyResolution = await resolveERecht24ApiKey();
  logApiKeyDiagnostics(document, keyResolution);

  if (!keyResolution.apiKey) {
    return {
      html: "",
      modified: "",
      warnings: "",
      error: "missing_api_key",
    };
  }

  try {
    const response = await fetch(ERECHT24_ENDPOINTS[document], {
      method: "GET",
      headers: {
        "eRecht24-api-key": keyResolution.apiKey,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.warn("[eRecht24] API request failed", {
        document,
        status: response.status,
      });

      return {
        html: "",
        modified: "",
        warnings: "",
        error: `e_recht24_${response.status}`,
      };
    }

    const data = (await response.json()) as ERecht24ApiResponse;
    const html = (data.html_de ?? data.html_en ?? "").trim();

    if (!html) {
      return {
        html: "",
        modified: "",
        warnings: "",
        error: "e_recht24_empty_payload",
      };
    }

    return {
      html,
      modified: data.modified ?? "",
      warnings: data.warnings ?? "",
      error: "",
    };
  } catch (error) {
    console.warn("[eRecht24] API request unreachable", {
      document,
      error: error instanceof Error ? error.message : "unknown",
    });

    return {
      html: "",
      modified: "",
      warnings: "",
      error: "e_recht24_unreachable",
    };
  }
}
