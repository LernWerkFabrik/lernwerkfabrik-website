import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";

export interface WorkerRuntimeEnv {
  [key: string]: string | undefined;
  NEXT_PUBLIC_SUPABASE_URL?: string;
  SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  NEXT_PUBLIC_TURNSTILE_SITE_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
  RESEND_API_KEY?: string;
  CF_WORKER_NAME?: string;
  NEXTJS_ENV?: string;
}

export async function getWorkerRuntimeEnvAsync(): Promise<WorkerRuntimeEnv | null> {
  try {
    const context = await getCloudflareContext({ async: true });
    return (context?.env ?? null) as WorkerRuntimeEnv | null;
  } catch {
    return null;
  }
}
