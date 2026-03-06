import { getCloudflareContext } from "@opennextjs/cloudflare";

const ERECHT24_ENDPOINTS = {
  imprint: "https://api.e-recht24.de/v2/imprint",
  privacyPolicy: "https://api.e-recht24.de/v2/privacyPolicy",
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
  source: "cloudflare_binding" | "process_env_fallback" | "missing";
  rawLength: number;
  hadEdgeWhitespace: boolean;
  hadOuterQuotes: boolean;
};

export type ERecht24LoadResult = {
  html: string;
  modified: string;
  warnings: string;
  error: string;
};

export type ERecht24ApiKeyDiagnostics = {
  source: ERecht24ApiKeyResolution["source"];
  present: boolean;
  length: number;
  rawLength: number;
  hadEdgeWhitespace: boolean;
  hadOuterQuotes: boolean;
};

function normalizeApiKey(value: string) {
  const rawLength = value.length;
  const hadEdgeWhitespace = value !== value.trim();

  let normalized = value.trim();
  let hadOuterQuotes = false;

  if (
    (normalized.startsWith('"') && normalized.endsWith('"')) ||
    (normalized.startsWith("'") && normalized.endsWith("'"))
  ) {
    normalized = normalized.slice(1, -1).trim();
    hadOuterQuotes = true;
  }

  return {
    normalized,
    rawLength,
    hadEdgeWhitespace,
    hadOuterQuotes,
  };
}

async function resolveERecht24ApiKey(): Promise<ERecht24ApiKeyResolution> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const value = (env as Record<string, unknown>).ERECHT24_API_KEY;

    if (typeof value === "string") {
      const normalized = normalizeApiKey(value);
      const apiKey = normalized.normalized;
      if (apiKey) {
        return {
          apiKey,
          source: "cloudflare_binding",
          rawLength: normalized.rawLength,
          hadEdgeWhitespace: normalized.hadEdgeWhitespace,
          hadOuterQuotes: normalized.hadOuterQuotes,
        };
      }
    }
  } catch {
    // Outside Workers runtime the Cloudflare context may be unavailable.
  }

  const processValue = process.env.ERECHT24_API_KEY;
  if (typeof processValue === "string") {
    const normalized = normalizeApiKey(processValue);
    const apiKey = normalized.normalized;
    if (apiKey) {
      return {
        apiKey,
        source: "process_env_fallback",
        rawLength: normalized.rawLength,
        hadEdgeWhitespace: normalized.hadEdgeWhitespace,
        hadOuterQuotes: normalized.hadOuterQuotes,
      };
    }
  }

  return {
    apiKey: "",
    source: "missing",
    rawLength: 0,
    hadEdgeWhitespace: false,
    hadOuterQuotes: false,
  };
}

function logApiKeyDiagnostics(document: ERecht24DocumentType, keyResolution: ERecht24ApiKeyResolution) {
  console.info("[eRecht24] API key diagnostics", {
    document,
    source: keyResolution.source,
    present: keyResolution.apiKey.length > 0,
    length: keyResolution.apiKey.length,
    rawLength: keyResolution.rawLength,
    hadEdgeWhitespace: keyResolution.hadEdgeWhitespace,
    hadOuterQuotes: keyResolution.hadOuterQuotes,
  });
}

export async function getERecht24ApiKeyDiagnostics(): Promise<ERecht24ApiKeyDiagnostics> {
  const keyResolution = await resolveERecht24ApiKey();

  return {
    source: keyResolution.source,
    present: keyResolution.apiKey.length > 0,
    length: keyResolution.apiKey.length,
    rawLength: keyResolution.rawLength,
    hadEdgeWhitespace: keyResolution.hadEdgeWhitespace,
    hadOuterQuotes: keyResolution.hadOuterQuotes,
  };
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
    const endpoint = ERECHT24_ENDPOINTS[document];
    const headers = new Headers({
      "eRecht24-api-key": keyResolution.apiKey,
      Accept: "application/json",
    });

    console.info("[eRecht24] fetch diagnostics", {
      document,
      endpoint,
      hasApiKeyHeader: headers.has("eRecht24-api-key"),
      acceptHeader: headers.get("Accept"),
      apiKeyLength: keyResolution.apiKey.length,
    });

    const response = await fetch(endpoint, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    if (!response.ok) {
      let bodySnippet = "";
      try {
        bodySnippet = (await response.text()).slice(0, 240);
      } catch {
        bodySnippet = "";
      }

      console.warn("[eRecht24] API request failed", {
        document,
        status: response.status,
        bodySnippet,
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
