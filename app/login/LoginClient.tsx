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

import { signIn } from "@/lib/auth";
import { setProfileClient } from "@/lib/profile";

export default function LoginClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const redirect = sp.get("redirect") || "/dashboard";

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function validate(): string | null {
    const e = email.trim();
    const p = password;

    if (!e) return "Bitte gib eine E-Mail-Adresse ein.";
    if (!e.includes("@") || !e.includes(".")) return "Bitte gib eine gültige E-Mail-Adresse ein.";
    if (!p) return "Bitte gib ein Passwort ein.";
    return null;
  }

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);

    const result = await signIn({
      email: email.trim(),
      password,
    });

    if (!result.ok) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    setProfileClient({
      name: result.data.user?.name,
      email: result.data.user?.email ?? email.trim(),
      professionId: "industriemechaniker",
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
                Login
              </Badge>
            </div>
            <h1 className="lp-h1">Anmelden</h1>
            <p className="lp-muted">Anmeldung mit E-Mail und Passwort.</p>
          </div>
        </Surface>

        <Card>
          <CardHeader>
            <CardTitle className="lp-h2">Willkommen zurück</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <form onSubmit={onLogin} className="space-y-3">
              <div className="space-y-1.5">
                <div className="text-sm font-medium text-foreground/90">E-Mail</div>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="z. B. lukas.mech@firma.de"
                  autoComplete="email"
                  inputMode="email"
                />
              </div>

              <div className="space-y-1.5">
                <div className="text-sm font-medium text-foreground/90">Passwort</div>
                <Input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  placeholder="Dein Passwort"
                  autoComplete="current-password"
                />
              </div>

              {error ? <div className="text-sm text-destructive">{error}</div> : null}

              <Button type="submit" className="w-full rounded-full" disabled={submitting}>
                Weiter <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>

            <div className="text-sm text-muted-foreground">
              Noch keinen Account?{" "}
              <Link
                className="text-foreground underline underline-offset-4"
                href={`/signup?redirect=${encodeURIComponent(redirect)}`}
              >
                Registrieren
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
