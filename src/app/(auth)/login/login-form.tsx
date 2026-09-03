"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Mail, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormAlert } from "@/components/auth/form-field";
import { postJson } from "@/lib/client";
import { cn } from "@/lib/utils";

type Method = "email" | "mobile";
type MobileMode = "password" | "otp";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const nextParam = params.get("next");

  const [method, setMethod] = React.useState<Method>("email");
  const [mobileMode, setMobileMode] = React.useState<MobileMode>("password");
  const [otpSent, setOtpSent] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string>();
  const [notice, setNotice] = React.useState<string>();
  const [fields, setFields] = React.useState<Record<string, string>>({});

  const [email, setEmail] = React.useState("");
  const [mobile, setMobile] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [code, setCode] = React.useState("");
  const [remember, setRemember] = React.useState(true);

  /** Only follow `next` when it is a local path — never an attacker-supplied URL. */
  function safeNext(fallback: string): string {
    if (nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")) return nextParam;
    return fallback;
  }

  async function submitPassword(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(undefined);
    setFields({});

    const result = await postJson<{ next?: string }>("/api/auth/login", {
      method, email: method === "email" ? email : undefined,
      mobile: method === "mobile" ? mobile : undefined,
      password, remember,
    });

    if (!result.ok) {
      setError(result.error ?? "Sign in failed.");
      setFields(result.fields ?? {});
      setPending(false);
      return;
    }
    router.replace(safeNext(result.data.next ?? "/"));
    router.refresh();
  }

  async function requestOtp(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(undefined);
    setFields({});

    const result = await postJson<{ message?: string }>("/api/auth/otp/request", { mobile });
    setPending(false);

    if (!result.ok) {
      setError(result.error ?? "Could not send a code.");
      setFields(result.fields ?? {});
      return;
    }
    setOtpSent(true);
    setNotice(result.data.message);
  }

  async function verifyOtp(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(undefined);

    const result = await postJson<{ next?: string }>("/api/auth/otp/verify", { mobile, code, remember });
    if (!result.ok) {
      setError(result.error ?? "That code was not accepted.");
      setPending(false);
      return;
    }
    router.replace(safeNext(result.data.next ?? "/"));
    router.refresh();
  }

  const showOtpFlow = method === "mobile" && mobileMode === "otp";

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to continue building your skill profile.
        </p>
      </div>

      {/* Method toggle */}
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1" role="tablist" aria-label="Sign-in method">
        {([
          { value: "email" as const, label: "Continue with Email", icon: Mail },
          { value: "mobile" as const, label: "Continue with Mobile", icon: Smartphone },
        ]).map((option) => (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={method === option.value}
            onClick={() => { setMethod(option.value); setError(undefined); setOtpSent(false); }}
            className={cn(
              "flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all sm:text-sm",
              method === option.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <option.icon className="size-4" />
            <span className="hidden sm:inline">{option.label}</span>
            <span className="sm:hidden">{option.value === "email" ? "Email" : "Mobile"}</span>
          </button>
        ))}
      </div>

      {error && <FormAlert tone="error">{error}</FormAlert>}
      {notice && !error && <FormAlert tone="info">{notice}</FormAlert>}

      {method === "email" && (
        <form onSubmit={submitPassword} className="space-y-4" noValidate>
          <Field id="email" label="Email address" error={fields.email}>
            <Input
              id="email" name="email" type="email" autoComplete="email" required
              placeholder="you@college.edu" value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!fields.email}
            />
          </Field>

          <Field
            id="password" label="Password" error={fields.password}
            hint={<Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">Forgot password?</Link>}
          >
            <Input
              id="password" name="password" type="password" autoComplete="current-password" required
              value={password} onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!fields.password}
            />
          </Field>

          <RememberMe checked={remember} onChange={setRemember} />

          <Button type="submit" className="w-full" size="lg" disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            Sign in
          </Button>
        </form>
      )}

      {method === "mobile" && (
        <div className="space-y-4">
          <div className="flex gap-2 text-xs">
            {([
              { value: "password" as const, label: "Use password" },
              { value: "otp" as const, label: "Use one-time code" },
            ]).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => { setMobileMode(option.value); setError(undefined); setOtpSent(false); }}
                className={cn(
                  "rounded-full border px-3 py-1 font-medium transition-colors",
                  mobileMode === option.value ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          {!showOtpFlow && (
            <form onSubmit={submitPassword} className="space-y-4" noValidate>
              <Field id="mobile" label="Mobile number" error={fields.mobile ?? fields.email}>
                <Input
                  id="mobile" name="mobile" type="tel" inputMode="tel" autoComplete="tel" required
                  placeholder="98765 43210" value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  aria-invalid={!!fields.mobile}
                />
              </Field>
              <Field
                id="mobile-password" label="Password" error={fields.password}
                hint={<Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">Forgot password?</Link>}
              >
                <Input
                  id="mobile-password" type="password" autoComplete="current-password" required
                  value={password} onChange={(e) => setPassword(e.target.value)}
                />
              </Field>
              <RememberMe checked={remember} onChange={setRemember} />
              <Button type="submit" className="w-full" size="lg" disabled={pending}>
                {pending && <Loader2 className="size-4 animate-spin" />}
                Sign in
              </Button>
            </form>
          )}

          {showOtpFlow && !otpSent && (
            <form onSubmit={requestOtp} className="space-y-4" noValidate>
              <Field id="otp-mobile" label="Mobile number" error={fields.mobile}>
                <Input
                  id="otp-mobile" type="tel" inputMode="tel" autoComplete="tel" required
                  placeholder="98765 43210" value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                />
              </Field>
              <Button type="submit" className="w-full" size="lg" disabled={pending}>
                {pending && <Loader2 className="size-4 animate-spin" />}
                Send one-time code
              </Button>
            </form>
          )}

          {showOtpFlow && otpSent && (
            <form onSubmit={verifyOtp} className="space-y-4" noValidate>
              <Field id="otp-code" label="6-digit code">
                <Input
                  id="otp-code" inputMode="numeric" pattern="\d{6}" maxLength={6} required
                  autoComplete="one-time-code" placeholder="123456"
                  className="text-center text-lg tracking-[0.4em]"
                  value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                />
              </Field>
              <RememberMe checked={remember} onChange={setRemember} />
              <Button type="submit" className="w-full" size="lg" disabled={pending || code.length !== 6}>
                {pending && <Loader2 className="size-4 animate-spin" />}
                Verify and sign in
              </Button>
              <button
                type="button"
                onClick={() => { setOtpSent(false); setCode(""); setNotice(undefined); }}
                className="w-full text-xs text-muted-foreground hover:text-foreground"
              >
                Use a different number
              </button>
            </form>
          )}
        </div>
      )}

      <p className="text-center text-sm text-muted-foreground">
        New to LinCode?{" "}
        <Link href="/signup" className="font-medium text-primary hover:underline">Create an account</Link>
      </p>

      <DemoCredentials />
    </div>
  );
}

function RememberMe({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
      <input
        type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)}
        className="size-4 rounded border-input accent-primary"
      />
      Keep me signed in for 30 days
    </label>
  );
}

const DEMO = [
  ["Student", "priya@student.demo"],
  ["Faculty", "faculty@demo.edu"],
  ["Industry", "recruiter@nimbus.demo"],
  ["Institution", "cdc@demo.edu"],
];

/**
 * Demo accounts for evaluating the four role-based applications. These are
 * seeded fixtures in the demo dataset, not production credentials.
 */
function DemoCredentials() {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="rounded-xl border bg-muted/40 p-3.5 text-xs">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between font-medium text-foreground"
        aria-expanded={open}
      >
        Demo accounts (one per role)
        <span className="text-muted-foreground">{open ? "Hide" : "Show"}</span>
      </button>
      {open && (
        <div className="mt-3 space-y-1.5 text-muted-foreground">
          {DEMO.map(([role, address]) => (
            <div key={role} className="flex items-center justify-between gap-3">
              <span className="font-medium text-foreground">{role}</span>
              <code className="truncate rounded bg-background px-1.5 py-0.5">{address}</code>
            </div>
          ))}
          <p className="pt-1.5">
            Password for all four: <code className="rounded bg-background px-1.5 py-0.5">Demo@Skill2026</code>
          </p>
        </div>
      )}
    </div>
  );
}
