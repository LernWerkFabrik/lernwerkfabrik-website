import "server-only";

import { getWorkerRuntimeEnvAsync, type WorkerRuntimeEnv } from "@/lib/cloudflare/env";
import { SERVER_RUNTIME_ENV } from "@/lib/generated/server-runtime-env";

type EnvSource = "build_embedded" | "process_env" | "cloudflare_binding" | "missing";

type EnvResolution = {
  value: string;
  source: EnvSource;
  matchedName: string | null;
};

function normalizeEnvValue(value: string) {
  let normalized = value.trim();

  if (
    (normalized.startsWith('"') && normalized.endsWith('"')) ||
    (normalized.startsWith("'") && normalized.endsWith("'"))
  ) {
    normalized = normalized.slice(1, -1).trim();
  }

  return normalized;
}

async function readCloudflareRuntimeEnv() {
  return (await getWorkerRuntimeEnvAsync()) as WorkerRuntimeEnv | null;
}

async function resolveEnvValue(name: string): Promise<EnvResolution> {
  const buildValue = SERVER_RUNTIME_ENV.values[name as keyof typeof SERVER_RUNTIME_ENV.values];
  if (typeof buildValue === "string") {
    const normalized = normalizeEnvValue(buildValue);
    if (normalized) {
      return {
        value: normalized,
        source: "build_embedded",
        matchedName: name,
      };
    }
  }

  const processValue = process.env[name];
  if (typeof processValue === "string") {
    const normalized = normalizeEnvValue(processValue);
    if (normalized) {
      return {
        value: normalized,
        source: "process_env",
        matchedName: name,
      };
    }
  }

  const runtimeEnv = await readCloudflareRuntimeEnv();
  const runtimeValue = runtimeEnv?.[name];
  if (typeof runtimeValue === "string") {
    const normalized = normalizeEnvValue(runtimeValue);
    if (normalized) {
      return {
        value: normalized,
        source: "cloudflare_binding",
        matchedName: name,
      };
    }
  }

  return {
    value: "",
    source: "missing",
    matchedName: null,
  };
}

export async function getTurnstileSiteKeyServerAsync(): Promise<EnvResolution> {
  return resolveEnvValue("NEXT_PUBLIC_TURNSTILE_SITE_KEY");
}

export async function getTurnstileSecretKeyServerAsync(): Promise<EnvResolution> {
  return resolveEnvValue("TURNSTILE_SECRET_KEY");
}
