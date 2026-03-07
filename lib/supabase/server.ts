import "server-only";

import { createClient } from "@supabase/supabase-js";
import { SERVER_RUNTIME_ENV } from "@/lib/generated/server-runtime-env";

type RuntimeEnvSource = Record<string, unknown> | null;
type EnvSource = "build_embedded" | "process_env" | "cloudflare_binding" | "missing";

type EnvResolution = {
  value: string;
  source: EnvSource;
  matchedName: string | null;
  rawLength: number;
  hadEdgeWhitespace: boolean;
  hadOuterQuotes: boolean;
};

export type SupabaseEnvDiagnostics = {
  runtime: {
    available: boolean;
    error: string | null;
    workerName: string | null;
    nextJsEnv: string | null;
  };
  url: {
    source: EnvSource;
    present: boolean;
    matchedName: string | null;
    host: string | null;
    rawLength: number;
    hadEdgeWhitespace: boolean;
    hadOuterQuotes: boolean;
  };
  anonKey: {
    source: EnvSource;
    present: boolean;
    matchedName: string | null;
    length: number;
    rawLength: number;
    hadEdgeWhitespace: boolean;
    hadOuterQuotes: boolean;
  };
  serviceRoleKey: {
    source: EnvSource;
    present: boolean;
    matchedName: string | null;
    length: number;
    rawLength: number;
    hadEdgeWhitespace: boolean;
    hadOuterQuotes: boolean;
  };
  missing: string[];
};

type SupabaseServerEnv = {
  url: EnvResolution;
  anonKey: EnvResolution;
  serviceRoleKey: EnvResolution;
  runtime: SupabaseEnvDiagnostics["runtime"];
  missing: string[];
};

function normalizeEnvValue(value: string) {
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

async function readCloudflareRuntimeEnv() {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const context = await getCloudflareContext({ async: true });
    const runtimeEnv = (context?.env ?? null) as RuntimeEnvSource;

    return {
      env: runtimeEnv,
      diagnostics: {
        available: Boolean(runtimeEnv),
        error: null,
        workerName:
          runtimeEnv && typeof runtimeEnv.CF_WORKER_NAME === "string" ? runtimeEnv.CF_WORKER_NAME : null,
        nextJsEnv:
          runtimeEnv && typeof runtimeEnv.NEXTJS_ENV === "string" ? runtimeEnv.NEXTJS_ENV : null,
      } satisfies SupabaseEnvDiagnostics["runtime"],
    };
  } catch (error) {
    return {
      env: null as RuntimeEnvSource,
      diagnostics: {
        available: false,
        error: error instanceof Error ? error.message : "cloudflare_context_unavailable",
        workerName: null,
        nextJsEnv: null,
      } satisfies SupabaseEnvDiagnostics["runtime"],
    };
  }
}

function resolveEnvValue(
  name: string,
  aliases: string[] = [],
  runtimeEnv: RuntimeEnvSource = null
): EnvResolution {
  const candidates = [name, ...aliases];
  let emptyCandidate: EnvResolution | null = null;

  for (const candidate of candidates) {
    const buildValue = SERVER_RUNTIME_ENV.values[candidate as keyof typeof SERVER_RUNTIME_ENV.values];
    if (typeof buildValue === "string") {
      const normalized = normalizeEnvValue(buildValue);
      if (normalized.normalized) {
        return {
          value: normalized.normalized,
          source: "build_embedded",
          matchedName: candidate,
          rawLength: normalized.rawLength,
          hadEdgeWhitespace: normalized.hadEdgeWhitespace,
          hadOuterQuotes: normalized.hadOuterQuotes,
        };
      }
      if (SERVER_RUNTIME_ENV.mode === "generated") {
        emptyCandidate ??= {
          value: "",
          source: "build_embedded",
          matchedName: candidate,
          rawLength: normalized.rawLength,
          hadEdgeWhitespace: normalized.hadEdgeWhitespace,
          hadOuterQuotes: normalized.hadOuterQuotes,
        };
      }
    }

    const processValue = process.env[candidate];
    if (typeof processValue === "string") {
      const normalized = normalizeEnvValue(processValue);
      if (normalized.normalized) {
        return {
          value: normalized.normalized,
          source: "process_env",
          matchedName: candidate,
          rawLength: normalized.rawLength,
          hadEdgeWhitespace: normalized.hadEdgeWhitespace,
          hadOuterQuotes: normalized.hadOuterQuotes,
        };
      }
      emptyCandidate ??= {
        value: "",
        source: "process_env",
        matchedName: candidate,
        rawLength: normalized.rawLength,
        hadEdgeWhitespace: normalized.hadEdgeWhitespace,
        hadOuterQuotes: normalized.hadOuterQuotes,
      };
    }

    const runtimeValue = runtimeEnv?.[candidate];
    if (typeof runtimeValue === "string") {
      const normalized = normalizeEnvValue(runtimeValue);
      if (normalized.normalized) {
        return {
          value: normalized.normalized,
          source: "cloudflare_binding",
          matchedName: candidate,
          rawLength: normalized.rawLength,
          hadEdgeWhitespace: normalized.hadEdgeWhitespace,
          hadOuterQuotes: normalized.hadOuterQuotes,
        };
      }
      emptyCandidate ??= {
        value: "",
        source: "cloudflare_binding",
        matchedName: candidate,
        rawLength: normalized.rawLength,
        hadEdgeWhitespace: normalized.hadEdgeWhitespace,
        hadOuterQuotes: normalized.hadOuterQuotes,
      };
    }
  }

  return (
    emptyCandidate ?? {
      value: "",
      source: "missing",
      matchedName: null,
      rawLength: 0,
      hadEdgeWhitespace: false,
      hadOuterQuotes: false,
    }
  );
}

async function readSupabaseServerEnvAsync(): Promise<SupabaseServerEnv> {
  const runtimeResult = await readCloudflareRuntimeEnv();
  const url = resolveEnvValue("NEXT_PUBLIC_SUPABASE_URL", ["SUPABASE_URL"], runtimeResult.env);
  const anonKey = resolveEnvValue("NEXT_PUBLIC_SUPABASE_ANON_KEY", [], runtimeResult.env);
  const serviceRoleKey = resolveEnvValue("SUPABASE_SERVICE_ROLE_KEY", [], runtimeResult.env);
  const missing: string[] = [];

  if (!url.value) {
    missing.push("NEXT_PUBLIC_SUPABASE_URL|SUPABASE_URL");
  }
  if (!anonKey.value) {
    missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  if (!serviceRoleKey.value) {
    missing.push("SUPABASE_SERVICE_ROLE_KEY");
  }

  return {
    url,
    anonKey,
    serviceRoleKey,
    runtime: runtimeResult.diagnostics,
    missing,
  };
}

function throwMissingEnv(prefix: string, missing: string[]): never {
  throw new Error(`${prefix}:${missing.join(",")}`);
}

function readUrlHost(value: string): string | null {
  if (!value) return null;

  try {
    return new URL(value).host || null;
  } catch {
    return null;
  }
}

export async function getSupabaseServerEnvDiagnosticsAsync(): Promise<SupabaseEnvDiagnostics> {
  const env = await readSupabaseServerEnvAsync();

  return {
    runtime: env.runtime,
    url: {
      source: env.url.source,
      present: Boolean(env.url.value),
      matchedName: env.url.matchedName,
      host: readUrlHost(env.url.value),
      rawLength: env.url.rawLength,
      hadEdgeWhitespace: env.url.hadEdgeWhitespace,
      hadOuterQuotes: env.url.hadOuterQuotes,
    },
    anonKey: {
      source: env.anonKey.source,
      present: Boolean(env.anonKey.value),
      matchedName: env.anonKey.matchedName,
      length: env.anonKey.value.length,
      rawLength: env.anonKey.rawLength,
      hadEdgeWhitespace: env.anonKey.hadEdgeWhitespace,
      hadOuterQuotes: env.anonKey.hadOuterQuotes,
    },
    serviceRoleKey: {
      source: env.serviceRoleKey.source,
      present: Boolean(env.serviceRoleKey.value),
      matchedName: env.serviceRoleKey.matchedName,
      length: env.serviceRoleKey.value.length,
      rawLength: env.serviceRoleKey.rawLength,
      hadEdgeWhitespace: env.serviceRoleKey.hadEdgeWhitespace,
      hadOuterQuotes: env.serviceRoleKey.hadOuterQuotes,
    },
    missing: env.missing,
  };
}

export async function isSupabaseConfiguredServerAsync(): Promise<boolean> {
  const env = await readSupabaseServerEnvAsync();
  return env.missing.length === 0;
}

export async function createSupabaseAnonServerClientAsync() {
  const env = await readSupabaseServerEnvAsync();

  if (!env.url.value || !env.anonKey.value) {
    throwMissingEnv("missing_supabase_anon_env", env.missing);
  }

  return createClient(env.url.value, env.anonKey.value, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function createSupabaseServiceRoleClientAsync() {
  const env = await readSupabaseServerEnvAsync();

  if (!env.url.value || !env.serviceRoleKey.value) {
    throwMissingEnv("missing_supabase_service_env", env.missing);
  }

  return createClient(env.url.value, env.serviceRoleKey.value, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
