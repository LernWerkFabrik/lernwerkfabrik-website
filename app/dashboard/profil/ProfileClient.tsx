"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Building2,
  CalendarClock,
  Clock3,
  Download,
  MailCheck,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";

import Surface from "@/components/Surface";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DISPLAY_NAME_CHANGE_COOLDOWN_DAYS,
  DISPLAY_NAME_MAX_CHANGES,
  DISPLAY_NAME_MAX_LENGTH,
  evaluateDisplayNameChangePolicy,
  isDisplayNameAvailableClient,
  normalizeDisplayNameInput,
  sanitizeDisplayNameSeed,
  syncDisplayNameForEmailClient,
  validateDisplayName,
} from "@/lib/displayName";
import {
  getProfileClient,
  PROFESSIONS,
  setProfileClient,
  type ProfessionId,
  type UserProfile,
} from "@/lib/profile";
import { getPlanClient, type Plan } from "@/lib/entitlements";
import { signOut } from "@/lib/auth";

const LEARN_META_KEYS = new Set([
  "ts",
  "updatedAt",
  "kind",
  "moduleId",
  "module",
  "lessonId",
  "status",
  "questionIndex",
  "qIndex",
  "currentQuestionIndex",
  "activeQuestionIndex",
  "date",
  "lastUpdated",
]);

type LocalAuthUser = {
  email?: string;
  name?: string;
  createdAt?: string;
  plan?: Plan;
};

type LearningStats = {
  solvedTasksTotal: number;
  passRatePercent: number | null;
  examAttempts: number;
  modulesTouched: number;
  lastActivityMs: number | null;
  trainingSeconds: number;
};

type ProfileSnapshot = {
  profile: UserProfile;
  user: LocalAuthUser | null;
  plan: Plan;
  displayName: string;
  firstName: string;
  lastName: string;
  email: string;
  professionId: ProfessionId;
  professionTitle: string;
  trainingYear: string;
  company: string;
  organizationName: string;
  teamName: string;
  emailVerified: boolean;
  membershipKind: "subscription" | "one_time";
  membershipPriceLabel: string;
  membershipStartedAt: string | null;
  nextBillingAt: string | null;
  accessEndsAt: string | null;
  learning: LearningStats;
};

function parseJSON<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function parseIsoToMs(value: unknown): number | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : null;
}

function splitName(fullName: string | undefined): { firstName: string; lastName: string } {
  if (!fullName || !fullName.trim()) return { firstName: "", lastName: "" };
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return "—";
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
  }).format(new Date(ms));
}

function formatDateTime(ms: number | null): string {
  if (!ms) return "—";
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(ms));
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "—";
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) return `${minutes} Min`;
  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;
  return restMinutes ? `${hours} h ${restMinutes} Min` : `${hours} h`;
}

function getModuleIdFromKey(key: string, prefix: string): string {
  return key.slice(prefix.length).trim();
}

function readAuthUserClient(): LocalAuthUser | null {
  if (typeof window === "undefined") return null;

  const session = parseJSON<{ user?: LocalAuthUser | null }>(
    window.localStorage.getItem("lp.auth.v1")
  );
  return session?.user ?? null;
}

function collectLearningStats(): LearningStats {
  if (typeof window === "undefined") {
    return {
      solvedTasksTotal: 0,
      passRatePercent: null,
      examAttempts: 0,
      modulesTouched: 0,
      lastActivityMs: null,
      trainingSeconds: 0,
    };
  }

  let solvedTasksTotal = 0;
  let examAttempts = 0;
  let examPassed = 0;
  let lastActivityMs = 0;
  let trainingSeconds = 0;
  const modulesTouched = new Set<string>();

  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (!key) continue;

    if (key.startsWith("lp:learn:progress:") || key.startsWith("lp.learn.progress.")) {
      const prefix = key.startsWith("lp:learn:progress:")
        ? "lp:learn:progress:"
        : "lp.learn.progress.";
      const moduleId = getModuleIdFromKey(key, prefix);
      const progress = parseJSON<Record<string, unknown>>(window.localStorage.getItem(key));
      if (!progress) continue;

      let hasAnswers = false;
      for (const [questionId, status] of Object.entries(progress)) {
        if (LEARN_META_KEYS.has(questionId)) continue;
        hasAnswers = true;
        if (status === "correct") solvedTasksTotal += 1;
      }

      if (hasAnswers && moduleId) modulesTouched.add(moduleId);

      const ts = isPositiveNumber(progress.ts)
        ? progress.ts
        : isPositiveNumber(progress.updatedAt)
        ? progress.updatedAt
        : 0;
      lastActivityMs = Math.max(lastActivityMs, ts);
      continue;
    }

    if (key.startsWith("lp:run:") || key.startsWith("lp.run.")) {
      const prefix = key.startsWith("lp:run:") ? "lp:run:" : "lp.run.";
      const moduleId = getModuleIdFromKey(key, prefix);
      if (moduleId) modulesTouched.add(moduleId);

      const run = parseJSON<{ updatedAt?: unknown; createdAt?: unknown }>(
        window.localStorage.getItem(key)
      );
      if (!run) continue;

      const runTs = isPositiveNumber(run.updatedAt)
        ? run.updatedAt
        : isPositiveNumber(run.createdAt)
        ? run.createdAt
        : 0;
      lastActivityMs = Math.max(lastActivityMs, runTs);
      continue;
    }

    if (key.startsWith("lp:practiceRuns:")) {
      const moduleId = getModuleIdFromKey(key, "lp:practiceRuns:");
      const runs = parseJSON<Array<{ startedAt?: unknown; finishedAt?: unknown }>>(
        window.localStorage.getItem(key)
      );
      if (!Array.isArray(runs)) continue;
      if (runs.length && moduleId) modulesTouched.add(moduleId);

      for (const run of runs) {
        const startedAt = isPositiveNumber(run.startedAt) ? run.startedAt : 0;
        const finishedAt = isPositiveNumber(run.finishedAt) ? run.finishedAt : 0;

        if (finishedAt > startedAt && startedAt > 0) {
          trainingSeconds += Math.max(0, Math.round((finishedAt - startedAt) / 1000));
        }

        lastActivityMs = Math.max(lastActivityMs, startedAt, finishedAt);
      }
      continue;
    }

    if (key.startsWith("lp:exam:history:")) {
      const moduleId = getModuleIdFromKey(key, "lp:exam:history:");
      const history = parseJSON<
        Array<{
          percent?: unknown;
          createdAt?: unknown;
          timing?: { timeSpentSec?: unknown; durationSec?: unknown };
        }>
      >(window.localStorage.getItem(key));
      if (!Array.isArray(history)) continue;
      if (history.length && moduleId) modulesTouched.add(moduleId);

      for (const entry of history) {
        examAttempts += 1;
        if (typeof entry.percent === "number" && Number.isFinite(entry.percent) && entry.percent >= 67) {
          examPassed += 1;
        }

        const timed = entry.timing;
        if (timed && typeof timed === "object") {
          if (isPositiveNumber(timed.timeSpentSec)) trainingSeconds += timed.timeSpentSec;
          else if (isPositiveNumber(timed.durationSec)) trainingSeconds += timed.durationSec;
        }

        const createdAtMs = parseIsoToMs(entry.createdAt);
        if (createdAtMs) lastActivityMs = Math.max(lastActivityMs, createdAtMs);
      }
    }
  }

  return {
    solvedTasksTotal,
    passRatePercent: examAttempts > 0 ? Math.round((examPassed / examAttempts) * 100) : null,
    examAttempts,
    modulesTouched: modulesTouched.size,
    lastActivityMs: lastActivityMs > 0 ? lastActivityMs : null,
    trainingSeconds,
  };
}

function normalizeProfessionId(raw: string | undefined): ProfessionId {
  const found = PROFESSIONS.find((item) => item.id === raw);
  return found ? found.id : "industriemechaniker";
}

function buildSnapshot(): ProfileSnapshot {
  const profile = getProfileClient() ?? {};
  const user = readAuthUserClient();
  const plan = getPlanClient();

  const fallbackName = profile.name ?? user?.name ?? "";
  const split = splitName(fallbackName);

  const firstName = (profile.firstName ?? split.firstName ?? "").trim();
  const lastName = (profile.lastName ?? split.lastName ?? "").trim();
  const email = (profile.email ?? user?.email ?? "").trim();
  const explicitDisplayNameCandidate = normalizeDisplayNameInput(
    (profile.name ?? user?.name ?? "").trim()
  );
  const explicitDisplayName =
    validateDisplayName(explicitDisplayNameCandidate) === null
      ? explicitDisplayNameCandidate
      : sanitizeDisplayNameSeed(explicitDisplayNameCandidate);
  const emailSeed = email.includes("@") ? email.split("@")[0] : email;
  const fallbackDisplayName = sanitizeDisplayNameSeed(emailSeed || "azubi");
  const displayName = explicitDisplayName || fallbackDisplayName || "user123";

  const professionId = normalizeProfessionId(profile.professionId);
  const professionTitle =
    PROFESSIONS.find((entry) => entry.id === professionId)?.title ??
    "Industriemechaniker/in";

  const trainingYear = profile.trainingYear ?? "";
  const company = (profile.company ?? "").trim();
  const organizationName = (profile.organizationName ?? "").trim();
  const teamName = (profile.teamName ?? "").trim();

  const membershipKind = profile.membershipKind ?? "subscription";
  const membershipPriceLabel =
    profile.membershipPriceLabel ?? (plan === "pro" ? "9,90 € / Monat" : "Kostenlos");
  const membershipStartedAt =
    profile.membershipStartedAt ?? profile.createdAt ?? user?.createdAt ?? null;
  const nextBillingAt = profile.nextBillingAt ?? null;
  const accessEndsAt = profile.accessEndsAt ?? null;

  return {
    profile,
    user,
    plan,
    displayName,
    firstName,
    lastName,
    email,
    professionId,
    professionTitle,
    trainingYear,
    company,
    organizationName,
    teamName,
    emailVerified: profile.emailVerified ?? true,
    membershipKind,
    membershipPriceLabel,
    membershipStartedAt,
    nextBillingAt,
    accessEndsAt,
    learning: collectLearningStats(),
  };
}

function readFormValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export default function ProfileClient() {
  const router = useRouter();
  const [snapshot, setSnapshot] = React.useState<ProfileSnapshot>(() => buildSnapshot());
  const [editingPersonal, setEditingPersonal] = React.useState(false);
  const [personalError, setPersonalError] = React.useState<string | null>(null);
  const [editingOrganization, setEditingOrganization] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [notice, setNotice] = React.useState<string | null>(null);

  function refreshSnapshot() {
    setSnapshot(buildSnapshot());
  }

  function persistProfile(patch: Partial<UserProfile>, noticeText: string) {
    const createdAt =
      snapshot.profile.createdAt ?? snapshot.user?.createdAt ?? new Date().toISOString();

    setProfileClient({
      ...snapshot.profile,
      ...patch,
      createdAt,
    });

    setNotice(noticeText);
    refreshSnapshot();
  }

  function onSavePersonal(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    const displayName = normalizeDisplayNameInput(readFormValue(formData, "displayName"));
    const firstName = readFormValue(formData, "firstName");
    const lastName = readFormValue(formData, "lastName");
    const email = readFormValue(formData, "email");
    const trainingYear = readFormValue(formData, "trainingYear");
    const company = readFormValue(formData, "company");
    const professionRaw = readFormValue(formData, "professionId");

    const professionId = normalizeProfessionId(professionRaw);
    const displayNameError = validateDisplayName(displayName);
    if (displayNameError) {
      setNotice(null);
      setPersonalError(displayNameError);
      return;
    }

    const hasDisplayNameChanged =
      displayName !== normalizeDisplayNameInput(snapshot.displayName);

    if (hasDisplayNameChanged) {
      const policy = evaluateDisplayNameChangePolicy({
        displayNameChangeCount: snapshot.profile.displayNameChangeCount,
        displayNameLastChangedAt: snapshot.profile.displayNameLastChangedAt,
      });

      if (!policy.allowed) {
        setNotice(null);
        setPersonalError(policy.reason);
        return;
      }

      if (!isDisplayNameAvailableClient(displayName, snapshot.email)) {
        setNotice(null);
        setPersonalError("Anzeigename ist bereits vergeben.");
        return;
      }
    }

    setPersonalError(null);

    const nextDisplayNameChangeCount = hasDisplayNameChanged
      ? (snapshot.profile.displayNameChangeCount ?? 0) + 1
      : snapshot.profile.displayNameChangeCount;
    const nextDisplayNameLastChangedAt = hasDisplayNameChanged
      ? new Date().toISOString()
      : snapshot.profile.displayNameLastChangedAt;

    persistProfile(
      {
        name: displayName,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        email: email || undefined,
        displayNameChangeCount: nextDisplayNameChangeCount,
        displayNameLastChangedAt: nextDisplayNameLastChangedAt,
        emailVerified: email ? true : snapshot.profile.emailVerified ?? true,
        professionId,
        trainingYear:
          trainingYear === "1" ||
          trainingYear === "2" ||
          trainingYear === "3" ||
          trainingYear === "4"
            ? trainingYear
            : undefined,
        company: company || undefined,
      },
      "Persönliche Daten wurden gespeichert."
    );

    if (hasDisplayNameChanged) {
      syncDisplayNameForEmailClient(snapshot.email, displayName);
    }

    setEditingPersonal(false);
  }

  function onSaveOrganization(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const organizationName = readFormValue(formData, "organizationName");
    const teamName = readFormValue(formData, "teamName");

    persistProfile(
      {
        organizationName: organizationName || undefined,
        teamName: teamName || undefined,
      },
      "Organisationszugehörigkeit wurde aktualisiert."
    );

    setEditingOrganization(false);
  }

  function onExportData() {
    const payload = {
      exportedAt: new Date().toISOString(),
      profile: snapshot.profile,
      plan: snapshot.plan,
      learning: snapshot.learning,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = "lernwerkfabrik-profil-export.json";
    anchor.click();
    URL.revokeObjectURL(href);
  }

  async function onDeleteAccount() {
    const confirmed = window.confirm(
      "Möchtest du den Account lokal wirklich löschen? Diese Aktion entfernt Profil und lokale Sitzung auf diesem Gerät."
    );
    if (!confirmed) return;

    setIsDeleting(true);

    try {
      const email = snapshot.email.toLowerCase();
      const users = parseJSON<Record<string, unknown>>(
        window.localStorage.getItem("lp.users.v1")
      );

      if (users && email && users[email]) {
        delete users[email];
        window.localStorage.setItem("lp.users.v1", JSON.stringify(users));
      }

      window.localStorage.removeItem("lp.profile.v1");
      window.localStorage.removeItem("lp.plan.v1");

      try {
        await fetch("/api/logout", { method: "POST" });
      } catch {
        // ignore
      }

      await signOut();

      router.replace("/");
      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  }

  const planLabel = snapshot.plan === "pro" ? "Pro" : "Free";
  const showSubscriptionData =
    snapshot.plan === "pro" && snapshot.membershipKind !== "one_time";
  const showOneTimeData =
    snapshot.plan === "pro" && snapshot.membershipKind === "one_time";
  const displayNamePolicy = evaluateDisplayNameChangePolicy({
    displayNameChangeCount: snapshot.profile.displayNameChangeCount,
    displayNameLastChangedAt: snapshot.profile.displayNameLastChangedAt,
  });

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-12 pt-6 md:px-6 md:pt-8">
      <div className="space-y-8">
        <Surface className="p-6 md:p-7 lp-surface-1">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-foreground/80">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                Profil
              </div>
              <h1 className="lp-h1">Profil & Kontostatus</h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Transparenz zu Plan, Lernstand und Sicherheit in einer klaren,
                professionellen Übersicht.
              </p>
            </div>
            <Badge variant={snapshot.plan === "pro" ? "secondary" : "outline"} className="rounded-full">
              Plan: {planLabel}
            </Badge>
          </div>
        </Surface>

        {notice ? (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">
            {notice}
          </div>
        ) : null}

        <section>
          <Card className="relative rounded-2xl border bg-background/70 shadow-sm backdrop-blur">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="space-y-1">
                <CardTitle>Persönliche Informationen</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Basisdaten für Individualisierung und klare Lernzuordnung.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={() => {
                  setPersonalError(null);
                  setEditingPersonal((prev) => !prev);
                }}
              >
                {editingPersonal ? "Abbrechen" : "Bearbeiten"}
              </Button>
            </CardHeader>
            <CardContent>
              {!editingPersonal ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <InfoRow
                    label="Anzeigename"
                    value={snapshot.displayName || "-"}
                    icon={<UserRound className="h-4 w-4" />}
                  />
                  <InfoRow label="Vorname" value={snapshot.firstName || "—"} icon={<UserRound className="h-4 w-4" />} />
                  <InfoRow label="Nachname" value={snapshot.lastName || "—"} icon={<UserRound className="h-4 w-4" />} />
                  <InfoRow label="E-Mail-Adresse" value={snapshot.email || "—"} icon={<MailCheck className="h-4 w-4" />} />
                  <InfoRow
                    label="E-Mail-Status"
                    value={snapshot.emailVerified ? "E-Mail-Adresse verifiziert ✓" : "Nicht verifiziert"}
                    icon={<BadgeCheck className="h-4 w-4" />}
                  />
                  <InfoRow label="Ausbildungsberuf" value={snapshot.professionTitle} icon={<Building2 className="h-4 w-4" />} />
                  <InfoRow
                    label="Ausbildungsjahr"
                    value={snapshot.trainingYear ? `${snapshot.trainingYear}. Lehrjahr` : "—"}
                    icon={<CalendarClock className="h-4 w-4" />}
                  />
                  <InfoRow
                    label="Ausbildungsbetrieb"
                    value={snapshot.company || "—"}
                    icon={<Building2 className="h-4 w-4" />}
                  />
                </div>
              ) : (
                <form className="space-y-4" onSubmit={onSavePersonal}>
                  {personalError ? <p className="text-sm text-red-300">{personalError}</p> : null}

                  <Field label="Anzeigename (Pflicht)" htmlFor="displayName">
                    <Input
                      id="displayName"
                      name="displayName"
                      defaultValue={snapshot.displayName}
                      maxLength={DISPLAY_NAME_MAX_LENGTH}
                      autoComplete="username"
                      required
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      3-20 Zeichen. Nur `a-z`, `0-9`, `.`, `_`. Öffentlich sichtbar.
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Änderbar alle {DISPLAY_NAME_CHANGE_COOLDOWN_DAYS} Tage, maximal{" "}
                      {DISPLAY_NAME_MAX_CHANGES} Mal.
                      {displayNamePolicy.allowed
                        ? ` Noch verfügbar: ${displayNamePolicy.remainingChanges}.`
                        : ` ${displayNamePolicy.reason}`}
                    </p>
                  </Field>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Vorname (optional)" htmlFor="firstName">
                      <Input id="firstName" name="firstName" defaultValue={snapshot.firstName} />
                    </Field>
                    <Field label="Nachname (optional)" htmlFor="lastName">
                      <Input id="lastName" name="lastName" defaultValue={snapshot.lastName} />
                    </Field>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="E-Mail-Adresse" htmlFor="email">
                      <Input id="email" name="email" type="email" defaultValue={snapshot.email} />
                    </Field>

                    <Field label="Ausbildungsberuf" htmlFor="professionId">
                      <select
                        id="professionId"
                        name="professionId"
                        defaultValue={snapshot.professionId}
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {PROFESSIONS.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.title}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Ausbildungsjahr" htmlFor="trainingYear">
                      <select
                        id="trainingYear"
                        name="trainingYear"
                        defaultValue={snapshot.trainingYear}
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="">Nicht angegeben</option>
                        <option value="1">1. Lehrjahr</option>
                        <option value="2">2. Lehrjahr</option>
                        <option value="3">3. Lehrjahr</option>
                        <option value="4">4. Lehrjahr</option>
                      </select>
                    </Field>

                    <Field label="Ausbildungsbetrieb (optional)" htmlFor="company">
                      <Input id="company" name="company" defaultValue={snapshot.company} />
                    </Field>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button type="submit" className="rounded-full">
                      Persönliche Daten speichern
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => {
                        setPersonalError(null);
                        setEditingPersonal(false);
                      }}
                    >
                      Abbrechen
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </section>

        <section>
          <Card className="relative rounded-2xl border bg-background/70 shadow-sm backdrop-blur">
            <CardHeader>
              <CardTitle>Mitgliedschaft & Abrechnung</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Metric label="Plan" value={planLabel} />
                <Metric label="Preis" value={snapshot.membershipPriceLabel} />
                <Metric label="Startdatum" value={formatDate(snapshot.membershipStartedAt)} />
                {showSubscriptionData ? (
                  <Metric
                    label="Nächste Abrechnung"
                    value={snapshot.nextBillingAt ? formatDate(snapshot.nextBillingAt) : "Im Abo-Portal"}
                  />
                ) : showOneTimeData ? (
                  <Metric
                    label="Laufzeit-Ende"
                    value={snapshot.accessEndsAt ? formatDate(snapshot.accessEndsAt) : "Automatisch beendet"}
                  />
                ) : (
                  <Metric label="Status" value="Kein aktives Abo" />
                )}
              </div>

              <Separator />

              <div className="flex flex-wrap gap-2">
                {snapshot.plan === "free" ? (
                  <Button asChild className="rounded-full">
                    <Link href="/pricing">Upgrade zu Pro</Link>
                  </Button>
                ) : showSubscriptionData ? (
                  <Button asChild variant="outline" className="rounded-full">
                    <Link href="/pricing">Abo verwalten</Link>
                  </Button>
                ) : (
                  <Button asChild variant="outline" className="rounded-full">
                    <Link href="/pricing">Preise ansehen</Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <Card className="relative rounded-2xl border bg-background/70 shadow-sm backdrop-blur">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="space-y-1">
                <CardTitle>Lernübersicht</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Kompakte Kennzahlen für Fortschritt und Prüfungssicherheit.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={refreshSnapshot}
              >
                Aktualisieren
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <Metric label="Gelöste Aufgaben" value={`${snapshot.learning.solvedTasksTotal}`} />
                <Metric
                  label="Bestehquote"
                  value={
                    snapshot.learning.passRatePercent !== null
                      ? `${snapshot.learning.passRatePercent}%`
                      : "—"
                  }
                  sublabel={
                    snapshot.learning.examAttempts > 0
                      ? `${snapshot.learning.examAttempts} Prüfungen`
                      : "Noch keine Prüfung"
                  }
                />
                <Metric label="Bearbeitete Module" value={`${snapshot.learning.modulesTouched}`} />
                <Metric
                  label="Letzte Aktivität"
                  value={formatDateTime(snapshot.learning.lastActivityMs)}
                  icon={<Clock3 className="h-3.5 w-3.5 text-amber-300" />}
                />
                <Metric label="Trainingszeit" value={formatDuration(snapshot.learning.trainingSeconds)} />
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <Card className="relative rounded-2xl border bg-background/70 shadow-sm backdrop-blur">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="space-y-1">
                <CardTitle>Organisation</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Skalierbar für Teams, Ausbildungsbetriebe und Schulklassen.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={() => setEditingOrganization((prev) => !prev)}
              >
                {editingOrganization ? "Abbrechen" : "Bearbeiten"}
              </Button>
            </CardHeader>
            <CardContent>
              {!editingOrganization ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <InfoRow
                    label="Ausbildungsbetrieb"
                    value={snapshot.organizationName || "Kein Betrieb verbunden"}
                    icon={<Building2 className="h-4 w-4" />}
                  />
                  <InfoRow
                    label="Team"
                    value={snapshot.teamName || "Kein Team zugeordnet"}
                    icon={<UserRound className="h-4 w-4" />}
                  />
                </div>
              ) : (
                <form onSubmit={onSaveOrganization} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Ausbildungsbetrieb" htmlFor="organizationName">
                      <Input
                        id="organizationName"
                        name="organizationName"
                        defaultValue={snapshot.organizationName}
                        placeholder="z. B. Muster GmbH"
                      />
                    </Field>

                    <Field label="Team" htmlFor="teamName">
                      <Input
                        id="teamName"
                        name="teamName"
                        defaultValue={snapshot.teamName}
                        placeholder="z. B. Industriemechaniker 2. Lehrjahr"
                      />
                    </Field>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button type="submit" className="rounded-full">
                      Organisation speichern
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => setEditingOrganization(false)}
                    >
                      Abbrechen
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </section>

        <section>
          <Card className="relative rounded-2xl border bg-background/70 shadow-sm backdrop-blur">
            <CardHeader>
              <CardTitle>Sicherheit & Datenschutz</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-2">
                <Button variant="outline" className="justify-start rounded-full" disabled>
                  Passwort ändern (in Vorbereitung)
                </Button>
                <Button variant="outline" className="justify-start rounded-full" disabled>
                  Zwei-Faktor-Authentifizierung (optional später)
                </Button>
                <Button variant="outline" asChild className="justify-start rounded-full">
                  <Link href="/privacy/learn">Datenschutz-Einstellungen</Link>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="justify-start rounded-full"
                  onClick={onExportData}
                >
                  <Download className="h-4 w-4" />
                  Datenexport (JSON)
                </Button>
              </div>

              <Separator />

              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Account löschen</div>
                    <p className="text-xs text-muted-foreground">
                      Entfernt lokale Profil- und Sitzungsdaten auf diesem Gerät.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    className="rounded-full"
                    onClick={onDeleteAccount}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4" />
                    {isDeleting ? "Wird gelöscht..." : "Account löschen"}
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-4 w-4 text-amber-400" />
                <p>
                  Deine Profilangaben werden im MVP lokal gespeichert. Für
                  rechtliche Details siehe{" "}
                  <Link className="underline underline-offset-4 hover:text-foreground" href="/privacy/learn">
                    Datenschutz & Privatsphäre
                  </Link>
                  .
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function Metric({
  label,
  value,
  sublabel,
  icon,
}: {
  label: string;
  value: string;
  sublabel?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/40 p-3">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-1 text-base font-semibold text-foreground">{value}</div>
      {sublabel ? <div className="mt-0.5 text-xs text-muted-foreground">{sublabel}</div> : null}
    </div>
  );
}

function InfoRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/40 p-3">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}


