// lib/auth.ts
/**
 * Public auth facade for the app.
 * Keep imports stable: use "@/lib/auth" everywhere.
 */

export type {
  AppUser,
  AuthSession,
  AuthProviderId,
  SignInInput,
  SignUpInput,
  SessionContext,
  CookieStoreLike,
} from "./auth/provider";

export {
  getAuthProvider,
  getSession,
  getUser,
  signIn,
  signUp,
  signOut,
} from "./auth/provider";
