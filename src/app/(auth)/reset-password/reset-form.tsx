"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormAlert, PasswordMeter } from "@/components/auth/form-field";
import { postJson } from "@/lib/client";

export function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [token, setToken] = React.useState(params.get("token") ?? "");
  const [password, setPassword] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string>();
  const [fields, setFields] = React.useState<Record<string, string>>({});

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(undefined);
    setFields({});

    const result = await postJson<{ next?: string }>("/api/auth/reset-password", { token, password });
    if (!result.ok) {
      setError(result.error ?? "Could not reset your password.");
      setFields(result.fields ?? {});
      setPending(false);
      return;
    }
    router.replace("/login");
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Choose a new password</h1>
        <p className="text-sm text-muted-foreground">
          Resetting signs you out everywhere else.
        </p>
      </div>

      {error && <FormAlert tone="error">{error}</FormAlert>}

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field id="token" label="Reset token">
          <Input
            id="token" required value={token} onChange={(e) => setToken(e.target.value)}
            placeholder="Paste the token from your reset link"
          />
        </Field>

        <Field id="new-password" label="New password" error={fields.password}>
          <Input
            id="new-password" type="password" autoComplete="new-password" required
            value={password} onChange={(e) => setPassword(e.target.value)}
          />
          <PasswordMeter password={password} />
        </Field>

        <Button type="submit" className="w-full" size="lg" disabled={pending || !token}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          Reset password
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-primary hover:underline">Back to sign in</Link>
      </p>
    </div>
  );
}
