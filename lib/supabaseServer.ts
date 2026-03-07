import { createClient } from "@supabase/supabase-js";

type SupabaseServerEnv = {
  supabaseUrl: string;
  serviceRoleKey: string;
  missing: string[];
};

function readSupabaseServerEnv(): SupabaseServerEnv {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || process.env.SUPABASE_URL?.trim() || "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";
  const missing: string[] = [];

  if (!supabaseUrl) {
    missing.push("NEXT_PUBLIC_SUPABASE_URL|SUPABASE_URL");
  }
  if (!serviceRoleKey) {
    missing.push("SUPABASE_SERVICE_ROLE_KEY");
  }

  return { supabaseUrl, serviceRoleKey, missing };
}

export function createSupabaseServerClient() {
  const { supabaseUrl, serviceRoleKey, missing } = readSupabaseServerEnv();

  if (missing.length > 0) {
    throw new Error(`missing_supabase_server_env:${missing.join(",")}`);
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
