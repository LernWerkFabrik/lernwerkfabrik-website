// lib/auth/provider.ts
/**
 * Auth Adapter (Provider Pattern)
 * --------------------------------
 * Single source of truth for:
 * - Session
 * - User
 * - Sign-in / Sign-out
 *
 * Current provider: local (MVP) or supabase (server-backed routes)
 */

import { localAuthProvider } from "./providers/local";
import { supabaseAuthProvider } from "./providers/supabase";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

export type AuthProviderId = "local" | "supabase";

/**
 * Canonical user type for the whole app.
 * Keep this stable across providers.
 */
export type AppUser = {
  id: string;
  email: string;
  name: string;

  professionId?: string | null;
  plan?: "free" | "pro";
  createdAt?: string; // ISO
};

export type AuthSession = {
  provider: AuthProviderId;
  token: string;
  user: AppUser | null;
  expiresAt: string; // ISO
};

export type SignInInput = {
  email: string;
  password: string;
};

export type SignUpInput = {
  email: string;
  password: string;
  name: string;
  job?: string;
};

export type AuthResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type CookieValue = { value: string };

export type CookieStoreLike = {
  get(name: string): CookieValue | undefined;
};

export type SessionContext =
  | {
      /**
       * Server context: pass cookies() from next/headers
       */
      cookies: CookieStoreLike;
    }
  | {
      /**
       * Client context (default)
       */
      cookies?: undefined;
    };

export interface AuthProvider {
  id: AuthProviderId;

  getSession(ctx?: SessionContext): Promise<AuthResult<AuthSession | null>>;
  getUser(ctx?: SessionContext): Promise<AuthResult<AppUser | null>>;

  signIn(input: SignInInput): Promise<AuthResult<AuthSession>>;
  signUp(input: SignUpInput): Promise<AuthResult<AuthSession>>;

  signOut(): Promise<AuthResult<true>>;
}

/* ------------------------------------------------------------------ */
/* Provider selection                                                  */
/* ------------------------------------------------------------------ */

/**
 * Read provider from env (future-proof).
 * Defaults to "local".
 */
function readProviderEnv(): AuthProviderId {
  const raw =
    (process.env.NEXT_PUBLIC_AUTH_PROVIDER as AuthProviderId | undefined) ??
    "local";

  return raw === "supabase" ? "supabase" : "local";
}

/**
 * Provider singleton (never null).
 */
let _provider: AuthProvider | undefined;

/**
 * Provider factory / accessor.
 */
export function getAuthProvider(): AuthProvider {
  if (_provider) return _provider;

  const id = readProviderEnv();
  _provider = id === "supabase" ? supabaseAuthProvider : localAuthProvider;

  return _provider;
}

/* ------------------------------------------------------------------ */
/* Facade functions (use everywhere)                                   */
/* ------------------------------------------------------------------ */

export async function getSession(ctx?: SessionContext) {
  return getAuthProvider().getSession(ctx);
}

export async function getUser(ctx?: SessionContext) {
  return getAuthProvider().getUser(ctx);
}

export async function signIn(input: SignInInput) {
  return getAuthProvider().signIn(input);
}

export async function signUp(input: SignUpInput) {
  return getAuthProvider().signUp(input);
}

export async function signOut() {
  return getAuthProvider().signOut();
}
