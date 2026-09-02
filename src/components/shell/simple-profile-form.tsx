"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FormAlert } from "@/components/auth/form-field";
import { Badge } from "@/components/ui/badge";
import { postJson } from "@/lib/client";
import { cn } from "@/lib/utils";

export type FieldSpec =
  | { kind: "text"; name: string; label: string; placeholder?: string; required?: boolean; span?: boolean }
  | { kind: "number"; name: string; label: string; placeholder?: string; min?: number; max?: number; required?: boolean }
  | { kind: "textarea"; name: string; label: string; placeholder?: string; required?: boolean }
  | { kind: "tags"; name: string; label: string; options: string[]; max?: number };

/**
 * Shared onboarding form for faculty, industry and institution profiles.
 * Field specs come from the page so each role's copy stays its own.
 */
export function SimpleProfileForm({
  title,
  subtitle,
  sections,
  endpoint,
  submitLabel = "Continue",
}: {
  title: string;
  subtitle: string;
  sections: Array<{ heading: string; description: string; fields: FieldSpec[] }>;
  endpoint: string;
  submitLabel?: string;
}) {
  const router = useRouter();
  const [values, setValues] = React.useState<Record<string, string | number | string[]>>({});
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string>();
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  function set(name: string, value: string | number | string[]) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  function toggleTag(name: string, option: string, max = 10) {
    setValues((prev) => {
      const current = (prev[name] as string[] | undefined) ?? [];
      if (current.includes(option)) return { ...prev, [name]: current.filter((v) => v !== option) };
      if (current.length >= max) return prev;
      return { ...prev, [name]: [...current, option] };
    });
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(undefined);
    setFieldErrors({});

    const payload: Record<string, unknown> = {};
    for (const section of sections) {
      for (const field of section.fields) {
        const value = values[field.name];
        if (field.kind === "tags") payload[field.name] = (value as string[] | undefined) ?? [];
        else if (value !== undefined && value !== "") payload[field.name] = value;
      }
    }

    const result = await postJson<{ next?: string }>(endpoint, payload);
    if (!result.ok) {
      setError(result.error ?? "Could not save your profile.");
      setFieldErrors(result.fields ?? {});
      setPending(false);
      return;
    }
    router.replace(result.data.next ?? "/");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
      </div>

      {error && <FormAlert tone="error">{error}</FormAlert>}

      <form onSubmit={onSubmit} className="space-y-6" noValidate>
        {sections.map((section) => (
          <Card key={section.heading}>
            <CardHeader>
              <CardTitle className="text-base">{section.heading}</CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {section.fields.map((field) => {
                if (field.kind === "tags") {
                  const selected = (values[field.name] as string[] | undefined) ?? [];
                  return (
                    <div key={field.name} className="sm:col-span-2">
                      <p className="mb-2 text-sm font-medium">{field.label}</p>
                      <div className="flex flex-wrap gap-2">
                        {field.options.map((option) => {
                          const active = selected.includes(option);
                          return (
                            <button
                              key={option}
                              type="button"
                              onClick={() => toggleTag(field.name, option, field.max)}
                              aria-pressed={active}
                              className={cn(
                                "rounded-full border px-3 py-1.5 text-sm transition-colors",
                                active
                                  ? "border-primary bg-primary/10 font-medium text-primary"
                                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                              )}
                            >
                              {option}
                            </button>
                          );
                        })}
                      </div>
                      {selected.length > 0 && (
                        <p className="mt-2"><Badge variant="muted">{selected.length} selected</Badge></p>
                      )}
                    </div>
                  );
                }

                if (field.kind === "textarea") {
                  return (
                    <Field key={field.name} id={field.name} label={field.label} error={fieldErrors[field.name]} className="sm:col-span-2">
                      <Textarea
                        id={field.name} placeholder={field.placeholder} required={field.required}
                        value={(values[field.name] as string) ?? ""}
                        onChange={(e) => set(field.name, e.target.value)}
                      />
                    </Field>
                  );
                }

                return (
                  <Field
                    key={field.name} id={field.name} label={field.label}
                    error={fieldErrors[field.name]}
                    className={field.kind === "text" && field.span ? "sm:col-span-2" : undefined}
                  >
                    <Input
                      id={field.name}
                      type={field.kind === "number" ? "number" : "text"}
                      min={field.kind === "number" ? field.min : undefined}
                      max={field.kind === "number" ? field.max : undefined}
                      placeholder={field.placeholder}
                      required={field.required}
                      value={(values[field.name] as string | number | undefined) ?? ""}
                      onChange={(e) => set(field.name, field.kind === "number" ? Number(e.target.value) : e.target.value)}
                    />
                  </Field>
                );
              })}
            </CardContent>
          </Card>
        ))}

        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            {submitLabel}
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
