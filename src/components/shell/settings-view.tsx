"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Loader2, Monitor, Moon, Save, Sun } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Field, FormAlert, PasswordMeter } from "@/components/auth/form-field";
import { usePreferences, FONT_SCALES, type FontScale, type Theme } from "@/components/providers/preferences";
import { postJson } from "@/lib/client";
import { cn } from "@/lib/utils";

const THEMES: Array<{ value: Theme; label: string; icon: typeof Sun; hint: string }> = [
  { value: "light", label: "Light", icon: Sun, hint: "Always light" },
  { value: "dark", label: "Dark", icon: Moon, hint: "Always dark" },
  { value: "system", label: "System", icon: Monitor, hint: "Follow your device" },
];

const SCALE_ORDER: FontScale[] = ["sm", "base", "lg", "xl"];

export interface LearningDomainRow {
  id: string;
  name: string;
  level: string;
  progress: number;
  status: string;
}

export function SettingsView({
  account, learning, roleLabel,
}: {
  account: { name: string; email: string; mobile?: string };
  learning?: { domains: LearningDomainRow[] };
  roleLabel: string;
}) {
  const { theme, setTheme, fontScale, setFontScale } = usePreferences();

  return (
    <div className="space-y-6">
      {/* Appearance ---------------------------------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appearance</CardTitle>
          <CardDescription>Applies across the whole application and persists on this device.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="mb-2.5 text-sm font-medium">Theme</p>
            <div className="grid gap-2.5 sm:grid-cols-3">
              {THEMES.map((option) => {
                const active = theme === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTheme(option.value)}
                    aria-pressed={active}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      active ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-accent/50",
                    )}
                  >
                    <span className={cn("flex size-9 items-center justify-center rounded-lg", active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                      <option.icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cn("block text-sm font-medium", active && "text-primary")}>{option.label}</span>
                      <span className="block text-xs text-muted-foreground">{option.hint}</span>
                    </span>
                    {active && <Check className="size-4 shrink-0 text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>

          <Separator />

          <div>
            <div className="mb-2.5 flex items-baseline justify-between gap-3">
              <p className="text-sm font-medium">Interface text size</p>
              <Badge variant="muted">{FONT_SCALES[fontScale].label}</Badge>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-4">
              {SCALE_ORDER.map((scale) => {
                const active = fontScale === scale;
                return (
                  <button
                    key={scale}
                    type="button"
                    onClick={() => setFontScale(scale)}
                    aria-pressed={active}
                    className={cn(
                      "flex flex-col items-start gap-1 rounded-xl border p-3.5 transition-all",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      active ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-accent/50",
                    )}
                  >
                    <span
                      className={cn("font-semibold leading-none", active && "text-primary")}
                      style={{ fontSize: `${FONT_SCALES[scale].value}rem` }}
                    >
                      Aa
                    </span>
                    <span className={cn("text-xs font-medium", active && "text-primary")}>{FONT_SCALES[scale].label}</span>
                    <span className="text-[11px] text-muted-foreground">{FONT_SCALES[scale].hint}</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-2.5 text-xs text-muted-foreground">
              The whole interface scales with this setting — spacing and controls as well as text — so nothing overlaps
              or gets clipped at larger sizes.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Learning ------------------------------------------------------- */}
      {learning && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Learning</CardTitle>
            <CardDescription>Your enrolled domains and how you want to be nudged.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              {learning.domains.length === 0 && (
                <p className="text-sm text-muted-foreground">No domains enrolled yet.</p>
              )}
              {learning.domains.map((domain) => (
                <div key={domain.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{domain.name}</p>
                    <p className="text-xs capitalize text-muted-foreground">
                      {domain.level} track · {domain.progress}% complete
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={domain.status === "completed" ? "success" : "muted"} className="capitalize">
                      {domain.status.replace("_", " ")}
                    </Badge>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/student/learning/${domain.id}`}>Open</Link>
                    </Button>
                  </div>
                </div>
              ))}
              <Button asChild size="sm" variant="outline" className="w-full">
                <Link href="/student/learning">Manage learning domains</Link>
              </Button>
            </div>

            <Separator />
            <NotificationPreferences />
          </CardContent>
        </Card>
      )}

      {/* Account -------------------------------------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
          <CardDescription>Signed in as a {roleLabel.toLowerCase()}.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="settings-name" label="Name">
              <Input id="settings-name" value={account.name} readOnly disabled />
            </Field>
            <Field id="settings-email" label="Email">
              <Input id="settings-email" value={account.email} readOnly disabled />
            </Field>
            <Field id="settings-mobile" label="Mobile">
              <Input id="settings-mobile" value={account.mobile ?? "Not added"} readOnly disabled />
            </Field>
          </div>
          <p className="text-xs text-muted-foreground">
            Changing a sign-in identifier requires re-verifying it. Contact your administrator to update these for now.
          </p>
        </CardContent>
      </Card>

      <PasswordSection />

      {/* Accessibility --------------------------------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Accessibility</CardTitle>
          <CardDescription>How the interface behaves for you.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">Text size</strong> is set under Appearance above and scales the entire
            interface.
          </p>
          <p>
            <strong className="text-foreground">Reduced motion</strong> follows your operating system setting — when it
            is on, animations and transitions are disabled automatically.
          </p>
          <p>
            <strong className="text-foreground">Keyboard navigation</strong> is supported throughout, with a visible
            focus ring in both themes and a skip-to-content link on every page.
          </p>
          <p>
            <strong className="text-foreground">Status is never colour-only</strong> — active states, verification
            badges and progress all carry an icon or label alongside the colour.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function NotificationPreferences() {
  // Stored per browser for the MVP; the shape matches what a server-side
  // preferences table would hold.
  const [prefs, setPrefs] = React.useState({ opportunities: true, streak: true, email: false });

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("skillbridge.notifications");
      if (stored) setPrefs((prev) => ({ ...prev, ...JSON.parse(stored) }));
    } catch {
      // Storage can be unavailable (private mode); defaults are fine.
    }
  }, []);

  function toggle(key: keyof typeof prefs) {
    setPrefs((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem("skillbridge.notifications", JSON.stringify(next));
      } catch {
        // Ignore: the toggle still applies for this session.
      }
      return next;
    });
  }

  const ROWS = [
    { key: "opportunities" as const, label: "New opportunity matches", hint: "When a posting scores above 70% against your profile" },
    { key: "streak" as const, label: "Streak reminders", hint: "A nudge when your streak is about to break" },
    { key: "email" as const, label: "Email digests", hint: "A weekly summary of progress and new matches" },
  ];

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">Notifications</p>
      {ROWS.map((row) => (
        <div key={row.key} className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm">{row.label}</p>
            <p className="text-xs text-muted-foreground">{row.hint}</p>
          </div>
          <Switch checked={prefs[row.key]} onCheckedChange={() => toggle(row.key)} aria-label={row.label} />
        </div>
      ))}
    </div>
  );
}

function PasswordSection() {
  const [current, setCurrent] = React.useState("");
  const [next, setNext] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [message, setMessage] = React.useState<string>();
  const [error, setError] = React.useState<string>();
  const [fields, setFields] = React.useState<Record<string, string>>({});

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(undefined);
    setMessage(undefined);
    setFields({});

    const result = await postJson<{ message?: string }>("/api/account/password", {
      currentPassword: current,
      newPassword: next,
    });
    setPending(false);

    if (!result.ok) {
      setError(result.error ?? "Could not change your password.");
      setFields(result.fields ?? {});
      return;
    }
    setMessage(result.data.message ?? "Password updated.");
    setCurrent("");
    setNext("");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Password &amp; security</CardTitle>
        <CardDescription>
          Your current password is required — a stolen session alone cannot change your credentials.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {error && <FormAlert tone="error">{error}</FormAlert>}
          {message && <FormAlert tone="success">{message}</FormAlert>}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="current-password" label="Current password" error={fields.currentPassword}>
              <Input
                id="current-password" type="password" autoComplete="current-password"
                value={current} onChange={(e) => setCurrent(e.target.value)} required
              />
            </Field>
            <Field id="next-password" label="New password" error={fields.newPassword}>
              <Input
                id="next-password" type="password" autoComplete="new-password"
                value={next} onChange={(e) => setNext(e.target.value)} required
              />
              <PasswordMeter password={next} />
            </Field>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={pending || !current || !next}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Update password
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
