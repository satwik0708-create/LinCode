"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormAlert, PasswordMeter } from "@/components/auth/form-field";
import { postJson } from "@/lib/client";
import { cn } from "@/lib/utils";

export function SignupForm() {
  const router = useRouter();
  const [channel, setChannel] = React.useState<"email" | "mobile">("email");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string>();
  const [fields, setFields] = React.useState<Record<string, string>>({});

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [mobile, setMobile] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [accepted, setAccepted] = React.useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(undefined);
    setFields({});

    const result = await postJson<{ next?: string }>("/api/auth/signup", {
      name,
      email: channel === "email" ? email : undefined,
      mobile: channel === "mobile" ? mobile : undefined,
      password,
      acceptedTerms: accepted,
    });

    if (!result.ok) {
      setError(result.error ?? "Could not create your account.");
      setFields(result.fields ?? {});
      setPending(false);
      return;
    }

    // Every new account goes to role selection — nothing is accessible before it.
    router.replace(result.data.next ?? "/onboarding/role");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
        <p className="text-sm text-muted-foreground">
          One account, then choose whether you are joining as a student, faculty member, employer or institution.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
        {([
          { value: "email" as const, label: "Email", icon: Mail },
          { value: "mobile" as const, label: "Mobile", icon: Smartphone },
        ]).map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => { setChannel(option.value); setError(undefined); }}
            aria-pressed={channel === option.value}
            className={cn(
              "flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all",
              channel === option.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <option.icon className="size-4" />
            {option.label}
          </button>
        ))}
      </div>

      {error && <FormAlert tone="error">{error}</FormAlert>}

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field id="name" label="Full name" error={fields.name}>
          <Input
            id="name" autoComplete="name" required placeholder="Priya Sharma"
            value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!fields.name}
          />
        </Field>

        {channel === "email" ? (
          <Field id="signup-email" label="Email address" error={fields.email}>
            <Input
              id="signup-email" type="email" autoComplete="email" required placeholder="you@college.edu"
              value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!fields.email}
            />
          </Field>
        ) : (
          <Field id="signup-mobile" label="Mobile number" error={fields.mobile ?? fields.email}>
            <Input
              id="signup-mobile" type="tel" inputMode="tel" autoComplete="tel" required placeholder="98765 43210"
              value={mobile} onChange={(e) => setMobile(e.target.value)} aria-invalid={!!fields.mobile}
            />
          </Field>
        )}

        <Field id="signup-password" label="Password" error={fields.password}>
          <Input
            id="signup-password" type="password" autoComplete="new-password" required
            value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={!!fields.password}
          />
          <PasswordMeter password={password} />
        </Field>

        <label className="flex cursor-pointer items-start gap-2.5 text-sm text-muted-foreground">
          <input
            type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} required
            className="mt-0.5 size-4 rounded border-input accent-primary"
          />
          <span>
            I agree to the terms of use and understand my learning data is used to generate my skill profile and recommendations.
          </span>
        </label>
        {fields.acceptedTerms && <p className="text-xs text-destructive">{fields.acceptedTerms}</p>}

        <Button type="submit" className="w-full" size="lg" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          Create account
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
