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
    return `Du bist auf der Warteliste (Platz #${position}). Wir informieren dich zum Launch. Kein Spam.`;
  }
  return "Du bist auf der Warteliste! Wir informieren dich zum Launch. Kein Spam.";
}

function buildAlreadyRegisteredMessage(position: number | null | undefined) {
  if (typeof position === "number" && Number.isFinite(position) && position > 0) {
    return `Du bist schon eingetragen (Platz #${position}).`;
  }
  return "Du bist schon eingetragen.";
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
      setMessage("Bitte eine gueltige E-Mail-Adresse eingeben.");
      return;
    }

    if (!siteKey) {
      setState("error");
      setMessage("Spam-Schutz ist nicht konfiguriert. Bitte spaeter erneut versuchen.");
      return;
    }

    if (!turnstileToken) {
      setState("error");
      setMessage("Bitte bestaetige kurz, dass du kein Bot bist.");
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

    try {
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

      const payload = (await response.json().catch(() => ({}))) as WaitlistApiResponse;
      if (!response.ok) {
        throw new Error(payload.message || "request_failed");
      }

      if (payload.status === "already_registered") {
        setState("already");
        setMessage(buildAlreadyRegisteredMessage(payload.waitlist_position));
      } else if (payload.status === "ok") {
        setState("success");
        setMessage(buildSuccessMessage(payload.waitlist_position));
        setEmail("");
      } else {
        throw new Error("unexpected_response");
      }

      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
        setTurnstileToken("");
      }
    } catch {
      setState("error");
      setMessage("Bitte spaeter erneut versuchen.");
    } finally {
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
          aria-label="E-Mail fuer Warteliste"
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

      <div className="flex justify-center md:justify-start">
        {siteKey ? (
          <div ref={widgetContainerRef} className="min-h-[65px]" />
        ) : (
          <div className="text-xs text-amber-300/90">Turnstile Site Key fehlt.</div>
        )}
      </div>

      {siteKey && !turnstileReady ? (
        <p className="text-center text-[0.78rem] leading-tight text-muted-foreground/80 md:text-left">
          Spam-Schutz wird geladen...
        </p>
      ) : null}

      <p className="text-center text-[0.78rem] leading-tight text-muted-foreground/90 md:text-left">
        Die Plattform startet bald. Sichere dir jetzt deinen Platz auf der Warteliste - wir informieren dich zum Launch. Kein Spam.
      </p>
      {message ? (
        <p role="status" className={cn("text-center text-xs md:text-left", messageClassName)}>
          {message}
        </p>
      ) : null}
    </form>
  );
}
