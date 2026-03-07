import { createClient } from "@supabase/supabase-js";

type RuntimeEnvSource = Record<string, unknown> | null;

function readStringEnv(
  name: string,
  aliases: string[] = [],
  runtimeEnv: RuntimeEnvSource = null
): string {
  const candidates = [name, ...aliases];

  for (const candidate of candidates) {
    const processValue = process.env[candidate];
    if (typeof processValue === "string" && processValue.trim()) {
      return processValue;
    }

    const runtimeValue = runtimeEnv?.[candidate];
    if (typeof runtimeValue === "string" && runtimeValue.trim()) {
      return runtimeValue;
    }
  }

  return "";
}

async function readCloudflareRuntimeEnv(): Promise<RuntimeEnvSource> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const context = await getCloudflareContext({ async: true });
    return (context?.env ?? null) as RuntimeEnvSource;
  } catch {
    return null;
  }
}

type SupabaseServerEnv = {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
  missing: string[];
};

async function readSupabaseServerEnvAsync(): Promise<SupabaseServerEnv> {
  const runtimeEnv = await readCloudflareRuntimeEnv();
  const url = readStringEnv("NEXT_PUBLIC_SUPABASE_URL", ["SUPABASE_URL"], runtimeEnv);
  const anonKey = readStringEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", [], runtimeEnv);
  const serviceRoleKey = readStringEnv("SUPABASE_SERVICE_ROLE_KEY", [], runtimeEnv);
  const missing: string[] = [];

  if (!url) {
    missing.push("NEXT_PUBLIC_SUPABASE_URL|SUPABASE_URL");
  }
  if (!anonKey) {
    missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  if (!serviceRoleKey) {
    missing.push("SUPABASE_SERVICE_ROLE_KEY");
  }

  return { url, anonKey, serviceRoleKey, missing };
}

function throwMissingEnv(prefix: string, missing: string[]): never {
  throw new Error(`${prefix}:${missing.join(",")}`);
}

export async function isSupabaseConfiguredServerAsync(): Promise<boolean> {
  const env = await readSupabaseServerEnvAsync();
  return env.missing.length === 0;
}

export async function createSupabaseAnonServerClientAsync() {
  const env = await readSupabaseServerEnvAsync();

  if (!env.url || !env.anonKey) {
    throwMissingEnv("missing_supabase_anon_env", env.missing);
  }

  return createClient(env.url, env.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function createSupabaseServiceRoleClientAsync() {
  const env = await readSupabaseServerEnvAsync();

  if (!env.url || !env.serviceRoleKey) {
    throwMissingEnv("missing_supabase_service_env", env.missing);
  }

  return createClient(env.url, env.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
