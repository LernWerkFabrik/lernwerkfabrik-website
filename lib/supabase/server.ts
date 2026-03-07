import { createClient } from "@supabase/supabase-js";

function requiredEnv(name: string, aliases: string[] = []): string {
  const candidates = [name, ...aliases];

  for (const candidate of candidates) {
    const value = process.env[candidate];
    if (value && value.trim()) {
      return value;
    }
  }

  throw new Error(`Missing required env: ${[name, ...aliases].join(" | ")}`);
}

function hasEnv(name: string, aliases: string[] = []): boolean {
  const candidates = [name, ...aliases];

  for (const candidate of candidates) {
    const value = process.env[candidate];
    if (value && value.trim()) {
      return true;
    }
  }

  return false;
}

function requiredSupabaseUrl(): string {
  return requiredEnv("NEXT_PUBLIC_SUPABASE_URL", ["SUPABASE_URL"]);
}

export function isSupabaseConfiguredServer(): boolean {
  return Boolean(
    hasEnv("NEXT_PUBLIC_SUPABASE_URL", ["SUPABASE_URL"]) &&
      hasEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") &&
      hasEnv("SUPABASE_SERVICE_ROLE_KEY")
  );
}

export function createSupabaseAnonServerClient() {
  const url = requiredSupabaseUrl();
  const anonKey = requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function createSupabaseServiceRoleClient() {
  const url = requiredSupabaseUrl();
  const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
