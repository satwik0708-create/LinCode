"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormAlert } from "@/components/auth/form-field";
import { postJson } from "@/lib/client";
import { cn } from "@/lib/utils";

export function ForgotPasswordForm() {
  const [channel, setChannel] = React.useState<"email" | "mobile">("email");
  const [value, setValue] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [message, setMessage] = React.useState<string>();
  const [error, setError] = React.useState<string>();

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(undefined);

    const result = await postJson<{ message?: string }>("/api/auth/forgot-password", {
      email: channel === "email" ? value : undefined,
      mobile: channel === "mobile" ? value : undefined,
    });
    setPending(false);

    if (!result.ok) {
      setError(result.error ?? "Could not process that request.");
      return;
    }
    // The response is identical for registered and unregistered addresses.
    setMessage(result.data.message);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="space-y-6 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-success/12 text-success">
          <MailCheck className="size-6" />
        </span>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Check your inbox</h1>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
        <FormAlert tone="info">
          We never confirm whether an account exists for a given address — that would let anyone test which
          addresses are registered here.
        </FormAlert>
        <Button asChild variant="outline" className="w-full">
          <Link href="/login">
            <ArrowLeft className="size-4" />
            Back to sign in
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>
        <p className="text-sm text-muted-foreground">
          Tell us how you signed up and we&rsquo;ll send instructions.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
        {(["email", "mobile"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => { setChannel(option); setValue(""); }}
            aria-pressed={channel === option}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium capitalize transition-all",
              channel === option ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option}
          </button>
        ))}
      </div>

      {error && <FormAlert tone="error">{error}</FormAlert>}

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field id="identifier" label={channel === "email" ? "Email address" : "Mobile number"}>
          <Input
            id="identifier"
            type={channel === "email" ? "email" : "tel"}
            inputMode={channel === "email" ? "email" : "tel"}
            autoComplete={channel === "email" ? "email" : "tel"}
            required
            placeholder={channel === "email" ? "you@college.edu" : "98765 43210"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </Field>

        <Button type="submit" className="w-full" size="lg" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          Send reset instructions
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-primary hover:underline">Back to sign in</Link>
      </p>
    </div>
  );
}
