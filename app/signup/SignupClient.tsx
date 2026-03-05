"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";

import Surface from "@/components/Surface";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import { signUp } from "@/lib/auth";
import {
  DISPLAY_NAME_MAX_LENGTH,
  DISPLAY_NAME_MIN_LENGTH,
  isDisplayNameAvailableClient,
  normalizeDisplayNameInput,
  suggestDisplayNameClient,
  validateDisplayName,
} from "@/lib/displayName";
import { setProfileClient } from "@/lib/profile";

const USE_SUPABASE_AUTH = process.env.NEXT_PUBLIC_AUTH_PROVIDER === "supabase";

type DisplayNameLookupResponse = {
  ok: boolean;
  available?: boolean;
  validationError?: string;
  suggestion?: string;
  error?: string;
};

function readEmailSeed(email: string): string {
  return email.includes("@") ? email.split("@")[0] : email;
}

export default function SignupClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const redirect = sp.get("redirect") || "/dashboard";

  const [displayName, setDisplayName] = React.useState("");
  const [displayNameTouched, setDisplayNameTouched] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [remoteAvailable, setRemoteAvailable] = React.useState<boolean | null>(null);
  const [remoteCheckPending, setRemoteCheckPending] = React.useState(false);
  const [remoteCheckError, setRemoteCheckError] = React.useState<string | null>(null);

  const normalizedDisplayName = normalizeDisplayNameInput(displayName);
  const localValidationError = validateDisplayName(normalizedDisplayName);

  const displayNameAvailable = React.useMemo(() => {
    if (!normalizedDisplayName || localValidationError) return false;
    if (!USE_SUPABASE_AUTH) return isDisplayNameAvailableClient(normalizedDisplayName);
    return remoteAvailable === true;
  }, [normalizedDisplayName, localValidationError, remoteAvailable]);

  React.useEffect(() => {
    if (!USE_SUPABASE_AUTH) return;
    if (!normalizedDisplayName || localValidationError) {
      setRemoteAvailable(null);
      setRemoteCheckError(null);
      return;
    }

    let cancelled = false;
    setRemoteCheckPending(true);
    setRemoteCheckError(null);

    const handle = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/auth/supabase/display-name?name=${encodeURIComponent(normalizedDisplayName)}`,
          { cache: "no-store" }
        );
        const payload = (await response.json()) as DisplayNameLookupResponse;
        if (cancelled) return;

        if (!payload.ok) {
          setRemoteAvailable(false);
          setRemoteCheckError(payload.error ?? "Verfügbarkeitscheck fehlgeschlagen.");
          return;
        }

        if (payload.validationError) {
          setRemoteAvailable(false);
          setRemoteCheckError(payload.validationError);
          return;
        }

        setRemoteAvailable(payload.available === true);
      } catch {
        if (cancelled) return;
        setRemoteAvailable(false);
        setRemoteCheckError("Verfügbarkeitscheck fehlgeschlagen.");
      } finally {
        if (!cancelled) setRemoteCheckPending(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [normalizedDisplayName, localValidationError]);

  React.useEffect(() => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return;
    if (displayNameTouched && displayName.trim()) return;

    let cancelled = false;

    async function fillSuggestion() {
      if (!USE_SUPABASE_AUTH) {
        const suggestion = suggestDisplayNameClient(trimmedEmail);
        if (!cancelled && suggestion) setDisplayName(suggestion);
        return;
      }

      try {
        const seed = readEmailSeed(trimmedEmail);
        const response = await fetch(
          `/api/auth/supabase/display-name?seed=${encodeURIComponent(seed)}`,
          { cache: "no-store" }
        );
        const payload = (await response.json()) as DisplayNameLookupResponse;
        if (cancelled) return;
        if (payload.ok && typeof payload.suggestion === "string" && payload.suggestion) {
          setDisplayName(payload.suggestion);
        }
      } catch {
        // ignore suggestion errors
      }
    }

    fillSuggestion();
    return () => {
      cancelled = true;
    };
  }, [email, displayNameTouched, displayName]);

  function validate(): string | null {
    const e = email.trim();
    const p = password;

    if (!e) return "Bitte gib eine E-Mail-Adresse ein.";
    if (!e.includes("@") || !e.includes(".")) return "Bitte gib eine gültige E-Mail-Adresse ein.";
    if (!p) return "Bitte gib ein Passwort ein.";
    if (p.length < 6) return "Passwort muss mindestens 6 Zeichen haben.";

    if (localValidationError) return localValidationError;
    if (USE_SUPABASE_AUTH && remoteCheckError) return remoteCheckError;
    if (USE_SUPABASE_AUTH && remoteCheckPending) return "Verfügbarkeit wird geprüft...";
    if (!displayNameAvailable) return "Anzeigename ist bereits vergeben.";

    return null;
  }

  function onDisplayNameChange(value: string) {
    const normalized = value.toLowerCase().replace(/\s+/g, "");
    setDisplayName(normalized);
    setDisplayNameTouched(true);
    setError(null);
  }

  async function applySuggestion() {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return;

    if (!USE_SUPABASE_AUTH) {
      const suggestion = suggestDisplayNameClient(trimmedEmail);
      if (suggestion) setDisplayName(suggestion);
      setDisplayNameTouched(false);
      setError(null);
      return;
    }

    try {
      const seed = readEmailSeed(trimmedEmail);
      const response = await fetch(
        `/api/auth/supabase/display-name?seed=${encodeURIComponent(seed)}`,
        { cache: "no-store" }
      );
      const payload = (await response.json()) as DisplayNameLookupResponse;
      if (payload.ok && typeof payload.suggestion === "string" && payload.suggestion) {
        setDisplayName(payload.suggestion);
        setDisplayNameTouched(false);
        setError(null);
      }
    } catch {
      setError("Vorschlag konnte nicht geladen werden.");
    }
  }

  async function onSignup(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);

    const finalDisplayName = normalizeDisplayNameInput(displayName);
    const finalEmail = email.trim();
    const finalPassword = password;

    const result = await signUp({
      email: finalEmail,
      password: finalPassword,
      name: finalDisplayName,
      job: "Industriemechaniker/in",
    });

    if (!result.ok) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    setProfileClient({
      name: finalDisplayName,
      email: finalEmail,
      professionId: "industriemechaniker",
      displayNameChangeCount: 0,
    });

    router.replace(redirect);
    router.refresh();
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-10 pt-6 md:px-6 md:pb-14 md:pt-8">
      <div className="space-y-6 md:space-y-8">
        <Surface className="p-6 md:p-7 lp-surface-1">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-full">
                MVP
              </Badge>
              <Badge variant="outline" className="rounded-full">
                Früher Zugang
              </Badge>
            </div>
            <h1 className="lp-h1">Registrieren</h1>
            <p className="lp-muted">Kostenloser MVP-Account (früher Zugang).</p>
          </div>
        </Surface>

        <Card>
          <CardHeader>
            <CardTitle className="lp-h2">Dein Profil</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <form onSubmit={onSignup} className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-medium text-foreground/90">Anzeigename</div>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
                    onClick={applySuggestion}
                  >
                    Vorschlag neu laden
                  </button>
                </div>
                <Input
                  value={displayName}
                  onChange={(e) => onDisplayNameChange(e.target.value)}
                  placeholder="z. B. lukas.mech"
                  autoComplete="username"
                  maxLength={DISPLAY_NAME_MAX_LENGTH}
                  required
                />
                <div className="text-xs text-muted-foreground">
                  {DISPLAY_NAME_MIN_LENGTH}-{DISPLAY_NAME_MAX_LENGTH} Zeichen · a-z · 0-9 · . und _
                </div>
                {normalizedDisplayName ? (
                  localValidationError ? (
                    <div className="text-xs text-destructive">{localValidationError}</div>
                  ) : remoteCheckPending ? (
                    <div className="text-xs text-muted-foreground">Verfügbarkeit wird geprüft...</div>
                  ) : displayNameAvailable ? (
                    <div className="text-xs text-emerald-300">Anzeigename ist verfügbar.</div>
                  ) : (
                    <div className="text-xs text-amber-300">Anzeigename ist bereits vergeben.</div>
                  )
                ) : null}
              </div>

              <div className="space-y-1.5">
                <div className="text-sm font-medium text-foreground/90">E-Mail</div>
                <Input
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  placeholder="z. B. lukas.mech@firma.de"
                  autoComplete="email"
                  inputMode="email"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="text-sm font-medium text-foreground/90">Passwort</div>
                <Input
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  type="password"
                  placeholder="Mindestens 6 Zeichen"
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="text-sm font-medium text-foreground/90">Beruf</div>
                <div className="rounded-2xl border border-primary/25 bg-primary/5 p-3">
                  <div className="lp-title">Industriemechaniker/in</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Aktueller Stand (weitere Berufe folgen)
                  </div>
                </div>
              </div>

              {error ? <div className="text-sm text-destructive">{error}</div> : null}

              <Button
                type="submit"
                className="w-full rounded-full"
                disabled={
                  submitting ||
                  !normalizedDisplayName ||
                  Boolean(localValidationError) ||
                  !displayNameAvailable ||
                  (USE_SUPABASE_AUTH && remoteCheckPending)
                }
              >
                Weiter <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>

            <div className="text-sm text-muted-foreground">
              Schon registriert?{" "}
              <Link
                className="text-foreground underline underline-offset-4"
                href={`/login?redirect=${encodeURIComponent(redirect)}`}
              >
                Anmelden
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
