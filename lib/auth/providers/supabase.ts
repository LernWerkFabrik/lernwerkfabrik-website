import type {
  AppUser,
  AuthProvider,
  AuthResult,
  AuthSession,
  SessionContext,
  SignInInput,
  SignUpInput,
} from "../provider";
import {
  decodeStoredSupabaseSession,
  isSupabaseSessionExpired,
  SUPABASE_SESSION_COOKIE,
  toAuthSession,
} from "./supabaseSession";

type ApiAuthResult<T> = AuthResult<T>;

function mapTransportError(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Supabase request failed.";
}

async function postJson<T>(path: string, body: unknown): Promise<ApiAuthResult<T>> {
  try {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const payload = (await res.json()) as ApiAuthResult<T>;
    if (!payload || typeof payload !== "object") {
      return { ok: false, error: "Invalid auth API response." };
    }
    return payload;
  } catch (error) {
    return { ok: false, error: mapTransportError(error) };
  }
}

async function getJson<T>(path: string): Promise<ApiAuthResult<T>> {
  try {
    const res = await fetch(path, {
      method: "GET",
      cache: "no-store",
    });
    const payload = (await res.json()) as ApiAuthResult<T>;
    if (!payload || typeof payload !== "object") {
      return { ok: false, error: "Invalid auth API response." };
    }
    return payload;
  } catch (error) {
    return { ok: false, error: mapTransportError(error) };
  }
}

function readServerCookieSession(ctx?: SessionContext): AuthResult<AuthSession | null> {
  const cookieRaw = ctx?.cookies?.get(SUPABASE_SESSION_COOKIE)?.value;
  if (!cookieRaw) return { ok: true, data: null };

  const decoded = decodeStoredSupabaseSession(cookieRaw);
  if (!decoded || isSupabaseSessionExpired(decoded.expiresAt)) {
    return { ok: true, data: null };
  }

  return { ok: true, data: toAuthSession(decoded) };
}

export const supabaseAuthProvider: AuthProvider = {
  id: "supabase",

  async getSession(ctx?: SessionContext): Promise<AuthResult<AuthSession | null>> {
    if (ctx?.cookies) return readServerCookieSession(ctx);

    if (typeof window === "undefined") {
      return { ok: true, data: null };
    }

    return getJson<AuthSession | null>("/api/auth/supabase/session");
  },

  async getUser(ctx?: SessionContext): Promise<AuthResult<AppUser | null>> {
    const session = await this.getSession(ctx);
    if (!session.ok) return session;
    return { ok: true, data: session.data?.user ?? null };
  },

  async signIn(input: SignInInput): Promise<AuthResult<AuthSession>> {
    if (typeof window === "undefined") {
      return { ok: false, error: "Supabase sign in is browser-only in this app." };
    }

    return postJson<AuthSession>("/api/auth/supabase/signin", input);
  },

  async signUp(input: SignUpInput): Promise<AuthResult<AuthSession>> {
    if (typeof window === "undefined") {
      return { ok: false, error: "Supabase sign up is browser-only in this app." };
    }

    return postJson<AuthSession>("/api/auth/supabase/signup", {
      email: input.email,
      password: input.password,
      displayName: input.name,
      job: input.job,
    });
  },

  async signOut(): Promise<AuthResult<true>> {
    if (typeof window === "undefined") {
      return { ok: true, data: true };
    }

    const result = await postJson<true>("/api/auth/supabase/logout", {});
    if (!result.ok) return result;
    return { ok: true, data: true };
  },
};
