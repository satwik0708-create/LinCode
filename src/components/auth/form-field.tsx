"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function Field({
  id, label, error, hint, children, className,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={id}>{label}</Label>
        {hint}
      </div>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="flex items-start gap-1.5 text-xs text-destructive">
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

export function FormAlert({ tone = "error", children }: { tone?: "error" | "success" | "info"; children: React.ReactNode }) {
  if (!children) return null;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-lg border px-3.5 py-3 text-sm",
        tone === "error" && "border-destructive/30 bg-destructive/10 text-destructive",
        tone === "success" && "border-success/30 bg-success/10 text-success",
        tone === "info" && "border-border bg-muted text-muted-foreground",
      )}
    >
      {children}
    </div>
  );
}

/** Live strength meter. Mirrors the rules the server enforces on submit. */
export function PasswordMeter({ password }: { password: string }) {
  const checks = [
    { label: "10+ characters", pass: password.length >= 10 },
    { label: "Upper & lowercase", pass: /[a-z]/.test(password) && /[A-Z]/.test(password) },
    { label: "A number", pass: /\d/.test(password) },
    { label: "A symbol", pass: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.pass).length;
  if (!password) return null;

  return (
    <div className="space-y-2 pt-1">
      <div className="flex gap-1" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              i < score ? (score <= 2 ? "bg-destructive" : score === 3 ? "bg-warning" : "bg-success") : "bg-muted",
            )}
          />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        {checks.map((check) => (
          <li key={check.label} className={cn(check.pass && "text-success")}>
            {check.pass ? "✓" : "○"} {check.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
