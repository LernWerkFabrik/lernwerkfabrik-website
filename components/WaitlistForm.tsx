"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type WaitlistEntry = {
  email: string;
  createdAt: string;
  source?: string;
};

const WAITLIST_STORAGE_KEY = "lwf.waitlist.v1";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

function readWaitlist(): WaitlistEntry[] {
  try {
    const raw = window.localStorage.getItem(WAITLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as WaitlistEntry[]) : [];
  } catch {
    return [];
  }
}

function writeWaitlist(entries: WaitlistEntry[]) {
  window.localStorage.setItem(WAITLIST_STORAGE_KEY, JSON.stringify(entries));
}

export default function WaitlistForm({
  source = "landing",
  className,
  buttonLabel = "Warteliste beitreten",
}: {
  source?: string;
  className?: string;
  buttonLabel?: string;
}) {
  const [email, setEmail] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [state, setState] = React.useState<"idle" | "success" | "error" | "already">("idle");

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

    setIsSubmitting(true);
    setMessage(null);
    setState("idle");

    try {
      await new Promise((resolve) => setTimeout(resolve, 450));

      const current = readWaitlist();
      const alreadyExists = current.some(
        (entry) => String(entry.email).trim().toLowerCase() === normalizedEmail
      );

      if (alreadyExists) {
        setState("already");
        setMessage("Du bist schon eingetragen.");
        return;
      }

      const next: WaitlistEntry[] = [
        { email: normalizedEmail, createdAt: new Date().toISOString(), source },
        ...current,
      ];
      writeWaitlist(next);

      setState("success");
      setMessage("Du bist auf der Warteliste!");
      setEmail("");
    } catch {
      setState("error");
      setMessage("Bitte später erneut versuchen.");
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
          className="h-11 rounded-full md:min-w-[16rem]"
          aria-label="E-Mail für Warteliste"
          pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$"
        />
        <Button type="submit" disabled={isSubmitting} className="h-11 rounded-full px-5 md:whitespace-nowrap">
          {isSubmitting ? "Wird eingetragen..." : buttonLabel}
        </Button>
      </div>

      <p className="text-center text-[0.78rem] leading-tight text-muted-foreground/90 md:text-left">
        Die Plattform startet bald. Sichere dir jetzt deinen Platz auf der Warteliste – wir informieren dich zum Launch. Kein Spam.
      </p>
      {message ? (
        <p role="status" className={cn("text-center text-xs md:text-left", messageClassName)}>
          {message}
        </p>
      ) : null}
    </form>
  );
}
