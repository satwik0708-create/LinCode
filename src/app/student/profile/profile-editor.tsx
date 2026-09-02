"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Field, FormAlert } from "@/components/auth/form-field";
import { postJson } from "@/lib/client";
import { cn } from "@/lib/utils";

const INTERESTS = [
  "Full Stack Engineer", "Frontend Developer", "Backend Developer", "Data Analyst",
  "Data Scientist", "ML Engineer", "Cloud Engineer", "DevOps Engineer",
  "Security Analyst", "Product Engineer", "AI Engineer", "SRE",
];

interface Initial {
  name: string; email: string; mobile: string;
  headline: string; about: string;
  institutionName: string; degree: string; branch: string;
  graduationYear: number; cgpa?: number; currentSemester?: number;
  location: string; careerInterests: string[];
}

export function ProfileEditor({ initial }: { initial: Initial }) {
  const router = useRouter();
  const [form, setForm] = React.useState(initial);
  const [pending, setPending] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState<string>();
  const [fields, setFields] = React.useState<Record<string, string>>({});

  function set<K extends keyof Initial>(key: K, value: Initial[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(undefined);
    setFields({});

    const result = await postJson("/api/account/profile", {
      name: form.name,
      headline: form.headline || undefined,
      about: form.about || undefined,
      institutionName: form.institutionName,
      degree: form.degree,
      branch: form.branch,
      graduationYear: form.graduationYear,
      cgpa: form.cgpa,
      currentSemester: form.currentSemester,
      location: form.location || undefined,
      careerInterests: form.careerInterests,
    });

    setPending(false);
    if (!result.ok) {
      setError(result.error ?? "Could not save your profile.");
      setFields(result.fields ?? {});
      return;
    }
    setSaved(true);
    router.refresh();
  }

  const years = Array.from({ length: 8 }, (_, i) => new Date().getFullYear() - 2 + i);

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      {error && <FormAlert tone="error">{error}</FormAlert>}
      {saved && <FormAlert tone="success">Profile saved.</FormAlert>}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">About you</CardTitle>
          <CardDescription>The header of your public portfolio.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field id="name" label="Full name" error={fields.name}>
            <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} required />
          </Field>
          <Field id="headline" label="Headline" error={fields.headline}>
            <Input id="headline" value={form.headline} onChange={(e) => set("headline", e.target.value)} placeholder="Final-year CS student building full-stack products" />
          </Field>
          <Field id="about" label="About" error={fields.about} className="sm:col-span-2">
            <Textarea id="about" value={form.about} onChange={(e) => set("about", e.target.value.slice(0, 1200))} placeholder="A short paragraph about what you build and where you want to go." />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contact</CardTitle>
          <CardDescription>
            Changing your sign-in email or mobile requires re-verification, so it is handled from Settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field id="email" label="Email">
            <Input id="email" value={form.email} readOnly disabled />
          </Field>
          <Field id="mobile" label="Mobile">
            <Input id="mobile" value={form.mobile || "Not added"} readOnly disabled />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Academic details</CardTitle>
          <CardDescription>Employers filter on these fields.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field id="institutionName" label="Institution" error={fields.institutionName} className="sm:col-span-2">
            <Input id="institutionName" value={form.institutionName} onChange={(e) => set("institutionName", e.target.value)} required />
          </Field>
          <Field id="degree" label="Degree" error={fields.degree}>
            <Input id="degree" value={form.degree} onChange={(e) => set("degree", e.target.value)} required />
          </Field>
          <Field id="branch" label="Branch" error={fields.branch}>
            <Input id="branch" value={form.branch} onChange={(e) => set("branch", e.target.value)} required />
          </Field>
          <Field id="graduationYear" label="Graduation year" error={fields.graduationYear}>
            <select
              id="graduationYear"
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={form.graduationYear}
              onChange={(e) => set("graduationYear", Number(e.target.value))}
            >
              {years.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
          </Field>
          <Field id="cgpa" label="CGPA" error={fields.cgpa}>
            <Input
              id="cgpa" type="number" step="0.01" min={0} max={10}
              value={form.cgpa ?? ""}
              onChange={(e) => set("cgpa", e.target.value ? Number(e.target.value) : undefined)}
            />
          </Field>
          <Field id="currentSemester" label="Current semester" error={fields.currentSemester}>
            <Input
              id="currentSemester" type="number" min={1} max={12}
              value={form.currentSemester ?? ""}
              onChange={(e) => set("currentSemester", e.target.value ? Number(e.target.value) : undefined)}
            />
          </Field>
          <Field id="location" label="Location" error={fields.location}>
            <Input id="location" value={form.location} onChange={(e) => set("location", e.target.value)} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Career interests</CardTitle>
          <CardDescription>These weight your career recommendations and job matches.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map((interest) => {
              const active = form.careerInterests.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  aria-pressed={active}
                  onClick={() =>
                    set(
                      "careerInterests",
                      active
                        ? form.careerInterests.filter((i) => i !== interest)
                        : form.careerInterests.length >= 8
                          ? form.careerInterests
                          : [...form.careerInterests, interest],
                    )
                  }
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm transition-colors",
                    active ? "border-primary bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-accent",
                  )}
                >
                  {interest}
                </button>
              );
            })}
          </div>
          {form.careerInterests.length > 0 && (
            <p className="mt-3"><Badge variant="muted">{form.careerInterests.length} of 8 selected</Badge></p>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save profile
        </Button>
      </div>
    </form>
  );
}
