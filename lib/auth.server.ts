// lib/auth.server.ts
import { cookies } from "next/headers";
import { getSession } from "@/lib/auth";

export const AUTH_COOKIE = "lp_auth_v1";

export async function isAuthedServer(): Promise<boolean> {
  try {
    const store = await cookies();

    // Source of truth: Provider versteht neues Cookie + Legacy
    const res = await getSession({ cookies: store });
    if (res.ok && res.data) return true;

    // Fallback: ganz alte Gates, falls Provider mal nicht greift
    return store.get(AUTH_COOKIE)?.value === "1";
  } catch {
    return false;
  }
}
