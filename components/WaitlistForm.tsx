"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
const TURNSTILE_SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type WaitlistApiResponse = {
  status?: "ok" | "already_registered" | "error";
  waitlist_position?: number | null;
  message?: string;
  details?: string;
  error_codes?: string[];
};

type TurnstileRenderOptions = {
  sitekey: string;
  callback?: (token: string) => void;
  "expired-callback"?: () => void;
  "error-callback"?: () => void;
  theme?: "auto" | "light" | "dark";
};

type TurnstileGlobal = {
  render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
  reset: (widgetId?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileGlobal;
  }
}

let turnstileScriptPromise: Promise<void> | null = null;

function ensureTurnstileScript() {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (turnstileScriptPromise) return turnstileScriptPromise;

  turnstileScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${TURNSTILE_SCRIPT_SRC}"]`
    );

    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("turnstile_script_failed")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("turnstile_script_failed"));
    document.head.appendChild(script);
  });

  return turnstileScriptPromise;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = document.cookie.match(new RegExp(`(?:^|; )${escapedName}=([^;]*)`));
  if (!match) return null;

  const value = decodeURIComponent(match[1] ?? "").trim();
  return value || null;
}

function detectDeviceType(userAgent: string): "mobile" | "tablet" | "desktop" {
  const ua = userAgent.toLowerCase();

  if (/ipad|tablet|playbook|silk|kindle/.test(ua) || (/android/.test(ua) && !/mobile/.test(ua))) {
    return "tablet";
  }
  if (/mobi|iphone|ipod|android/.test(ua)) {
    return "mobile";
  }
  return "desktop";
}

function readSourceFromUrl(): string {
  if (typeof window === "undefined") return "direct";

  const params = new URLSearchParams(window.location.search);
  const utmSource = (params.get("utm_source") ?? "").trim().toLowerCase();
  return utmSource || "direct";
}

function readCampaignFromUrl(): string | null {
  if (typeof window === "undefined") return null;

  const params = new URLSearchParams(window.location.search);
  const campaign = (params.get("utm_campaign") ?? "").trim();
  return campaign || null;
}

function buildSuccessMessage(position: number | null | undefined) {
  if (typeof position === "number" && Number.isFinite(position) && position > 0) {
    if (position <= 20) {
      return `Du bist auf der Warteliste (Platz #${position}). Early Access startet bald.`;
    }

    if (position <= 100) {
      return "Du bist unter den ersten 100 auf der Warteliste. Wir informieren dich zum Launch.";
    }

    return "Du bist auf der Warteliste! Wir informieren dich zum Launch.";
  }

  return "Du bist auf der Warteliste! Wir informieren dich zum Launch.";
}

function buildAlreadyRegisteredMessage(position: number | null | undefined) {
  if (typeof position === "number" && Number.isFinite(position) && position > 0) {
    if (position <= 20) {
      return `Du bist schon eingetragen (Platz #${position}).`;
    }

    if (position <= 100) {
      return "Du bist bereits unter den ersten 100 auf der Warteliste.";
    }

    return "Du bist bereits auf der Warteliste.";
  }

  return "Du bist bereits auf der Warteliste.";
}

function mapApiError(payload: WaitlistApiResponse, statusCode: number) {
  const reason = payload.message || "request_failed";

  if (reason === "turnstile_verification_failed") {
    const codes = (payload.error_codes || []).join(", ");
    return codes
      ? `Turnstile-Prüfung fehlgeschlagen (${codes}). Bitte erneut bestätigen.`
      : "Turnstile-Prüfung fehlgeschlagen. Bitte erneut bestätigen.";
  }

  if (reason === "missing_turnstile_token") {
    return "Bitte bestätige kurz, dass du kein Bot bist.";
  }

  if (reason === "turnstile_request_failed") {
    return "Turnstile ist gerade nicht erreichbar. Bitte in 1-2 Minuten erneut versuchen.";
  }

  if (reason === "missing_supabase_server_env") {
    return "Server-Konfiguration unvollständig (Supabase ENV). Bitte Deployment prüfen.";
  }

  if (reason === "insert_failed") {
    return payload.details
      ? `Eintrag konnte nicht gespeichert werden: ${payload.details}`
      : "Eintrag konnte nicht gespeichert werden.";
  }

  return `Anfrage fehlgeschlagen (${statusCode}). Bitte später erneut versuchen.`;
}

export default function WaitlistForm({
  className,
  buttonLabel = "Warteliste beitreten",
  inputClassName,
}: {
  className?: string;
  buttonLabel?: string;
  inputClassName?: string;
}) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";
  const widgetContainerRef = React.useRef<HTMLDivElement | null>(null);
  const widgetIdRef = React.useRef<string | null>(null);

  const [email, setEmail] = React.useState("");
  const [turnstileToken, setTurnstileToken] = React.useState("");
  const [turnstileReady, setTurnstileReady] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [state, setState] = React.useState<"idle" | "success" | "error" | "already">("idle");

  const resetTurnstile = React.useCallback(() => {
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
    setTurnstileToken("");
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    if (!siteKey || typeof window === "undefined" || !widgetContainerRef.current) return;

    ensureTurnstileScript()
      .then(() => {
        if (cancelled || !window.turnstile || !widgetContainerRef.current || widgetIdRef.current) return;

        widgetIdRef.current = window.turnstile.render(widgetContainerRef.current, {
          sitekey: siteKey,
          callback: (token: string) => setTurnstileToken(token || ""),
          "expired-callback": () => setTurnstileToken(""),
          "error-callback": () => setTurnstileToken(""),
          theme: "auto",
        });
        setTurnstileReady(true);
      })
      .catch(() => {
        if (!cancelled) {
          setTurnstileReady(false);
          setTurnstileToken("");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [siteKey]);

  const messageClassName = React.useMemo(() => {
    if (state === "success") return "text-emerald-400";
    if (state === "already") return "text-amber-300";
    if (state === "error") return "text-red-400";
    return "text-muted-foreground";
  }, [state]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !EMAIL_REGEX.test(normalizedEmail)) {
      setState("error");
      setMessage("Bitte eine gültige E-Mail-Adresse eingeben.");
      return;
    }

    if (!siteKey) {
      setState("error");
      setMessage("Spam-Schutz ist nicht konfiguriert. Bitte später erneut versuchen.");
      return;
    }

    if (!turnstileToken) {
      setState("error");
      setMessage("Bitte bestätige kurz, dass du kein Bot bist.");
      return;
    }

    const source = readSourceFromUrl();
    const campaign = readCampaignFromUrl();
    const referrer =
      typeof document !== "undefined" && document.referrer.trim() ? document.referrer.trim() : "direct";
    const deviceType =
      typeof navigator !== "undefined" ? detectDeviceType(navigator.userAgent || "") : "desktop";
    const country = getCookie("lw_country");

    setIsSubmitting(true);
    setMessage(null);
    setState("idle");

    let requestAttempted = false;

    try {
      requestAttempted = true;
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          source,
          campaign,
          referrer,
          device_type: deviceType,
          country,
          turnstile_token: turnstileToken,
        }),
      });

      const rawBody = await response.text();
      let payload: WaitlistApiResponse = {};

      if (rawBody) {
        try {
          payload = JSON.parse(rawBody) as WaitlistApiResponse;
        } catch {
          setState("error");
          setMessage(
            "Server-Antwort ist ungültig (kein JSON). Prüfe bitte, ob /api/waitlist erreichbar ist."
          );
          return;
        }
      }

      if (response.redirected && typeof window !== "undefined") {
        const finalPath = new URL(response.url, window.location.origin).pathname;
        if (!finalPath.startsWith("/api/waitlist")) {
          setState("error");
          setMessage(
            `API-Aufruf wurde umgeleitet (${finalPath}). Bitte Deploy-Konfiguration prüfen.`
          );
          return;
        }
      }

      if (!response.ok) {
        setState("error");
        setMessage(mapApiError(payload, response.status));
        return;
      }

      if (payload.status === "already_registered") {
        setState("already");
        setMessage(buildAlreadyRegisteredMessage(payload.waitlist_position));
      } else if (payload.status === "ok") {
        setState("success");
        setMessage(buildSuccessMessage(payload.waitlist_position));
        setEmail("");
      } else if (payload.status === "error") {
        setState("error");
        setMessage(mapApiError(payload, response.status));
      } else {
        setState("error");
        setMessage("Unerwartete Server-Antwort. Bitte /api/waitlist prüfen.");
      }
    } catch (error) {
      setState("error");
      const reason = error instanceof Error && error.message ? ` (${error.message})` : "";
      setMessage(`Bitte später erneut versuchen${reason}.`);
    } finally {
      if (requestAttempted) resetTurnstile();
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className={cn("w-full space-y-1.5", className)}>
      <div className="flex w-full flex-col gap-2 md:flex-row">
        <Input
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="name@beispiel.de"
          className={cn("h-11 rounded-full md:w-[20rem] md:min-w-0", inputClassName)}
          aria-label="E-Mail für Warteliste"
          pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$"
        />
        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-11 rounded-full px-5 md:whitespace-nowrap"
        >
          {isSubmitting ? "Wird eingetragen..." : buttonLabel}
        </Button>
      </div>

      <p className="text-center text-[0.78rem] leading-tight text-muted-foreground/90 md:text-left">
        Die Plattform startet bald. Sichere dir jetzt deinen Platz auf der Warteliste – wir informieren dich zum Launch. Kein Spam.
      </p>

      <div className="flex justify-center">
        {siteKey ? (
          <div ref={widgetContainerRef} className="min-h-[65px] [filter:brightness(0.92)]" />
        ) : (
          <div className="text-xs text-amber-300/90">Turnstile Site Key fehlt.</div>
        )}
      </div>

      {siteKey && !turnstileReady ? (
        <p className="text-center text-[0.78rem] leading-tight text-muted-foreground/80">
          Spam-Schutz wird geladen...
        </p>
      ) : null}
      {message ? (
        <p role="status" className={cn("text-center text-xs md:text-left", messageClassName)}>
          {message}
        </p>
      ) : null}
    </form>
  );
}
