"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FormAlert } from "@/components/auth/form-field";
import { Stepper, STUDENT_STEPS } from "@/components/shell/stepper";
import { Badge } from "@/components/ui/badge";
import { postJson } from "@/lib/client";
import { cn } from "@/lib/utils";

const INTERESTS = [
  "Full Stack Engineer", "Frontend Developer", "Backend Developer", "Data Analyst",
  "Data Scientist", "ML Engineer", "Cloud Engineer", "DevOps Engineer",
  "Security Analyst", "Product Engineer", "AI Engineer", "SRE",
];

interface Initial {
  institutionName: string;
  degree: string;
  branch: string;
  graduationYear: number;
  cgpa?: number;
  currentSemester?: number;
  location: string;
  careerInterests: string[];
}

export function ProfileForm({ name, initial }: { name: string; initial: Initial }) {
  const router = useRouter();
  const [form, setForm] = React.useState(initial);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string>();
  const [fields, setFields] = React.useState<Record<string, string>>({});

  function set<K extends keyof Initial>(key: K, value: Initial[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleInterest(interest: string) {
    setForm((prev) => ({
      ...prev,
      careerInterests: prev.careerInterests.includes(interest)
        ? prev.careerInterests.filter((i) => i !== interest)
        : prev.careerInterests.length >= 8
          ? prev.careerInterests
          : [...prev.careerInterests, interest],
    }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(undefined);
    setFields({});

    const result = await postJson<{ next?: string }>("/api/onboarding/student/profile", {
      ...form,
      cgpa: form.cgpa === undefined || Number.isNaN(form.cgpa) ? undefined : form.cgpa,
      currentSemester: form.currentSemester || undefined,
      location: form.location || undefined,
    });

    if (!result.ok) {
      setError(result.error ?? "Could not save your profile.");
      setFields(result.fields ?? {});
      setPending(false);
      return;
    }
    router.push(result.data.next ?? "/onboarding/student/domains");
  }

  const years = Array.from({ length: 8 }, (_, i) => new Date().getFullYear() - 2 + i);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <Stepper steps={STUDENT_STEPS} current="profile" />

      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Let&rsquo;s set up your profile, {name.split(" ")[0]}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This is what employers filter on and what your eligibility for each opportunity is checked against.
        </p>
      </div>

      {error && <FormAlert tone="error">{error}</FormAlert>}

      <form onSubmit={onSubmit} className="space-y-6" noValidate>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Academic details</CardTitle>
            <CardDescription>Where you study and what you study.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field id="institutionName" label="Institution" error={fields.institutionName} className="sm:col-span-2">
              <Input
                id="institutionName" required placeholder="Government College of Engineering, Pune"
                value={form.institutionName} onChange={(e) => set("institutionName", e.target.value)}
              />
            </Field>

            <Field id="degree" label="Degree" error={fields.degree}>
              <Input
                id="degree" required placeholder="B.Tech" list="degree-options"
                value={form.degree} onChange={(e) => set("degree", e.target.value)}
              />
              <datalist id="degree-options">
                {["B.Tech", "B.E.", "B.Sc", "BCA", "M.Tech", "M.Sc", "MCA", "Diploma"].map((d) => (
                  <option key={d} value={d} />
                ))}
              </datalist>
            </Field>

            <Field id="branch" label="Branch / stream" error={fields.branch}>
              <Input
                id="branch" required placeholder="Computer Engineering" list="branch-options"
                value={form.branch} onChange={(e) => set("branch", e.target.value)}
              />
              <datalist id="branch-options">
                {["Computer Engineering", "Computer Science", "Information Technology", "Electronics & Communication", "Electrical", "Mechanical", "Civil"].map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            </Field>

            <Field id="graduationYear" label="Graduation year" error={fields.graduationYear}>
              <select
                id="graduationYear"
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                value={form.graduationYear}
                onChange={(e) => set("graduationYear", Number(e.target.value))}
              >
                {years.map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
            </Field>

            <Field id="currentSemester" label="Current semester" error={fields.currentSemester} hint={<span className="text-xs text-muted-foreground">Optional</span>}>
              <Input
                id="currentSemester" type="number" min={1} max={12} placeholder="6"
                value={form.currentSemester ?? ""}
                onChange={(e) => set("currentSemester", e.target.value ? Number(e.target.value) : undefined)}
              />
            </Field>

            <Field id="cgpa" label="CGPA" error={fields.cgpa} hint={<span className="text-xs text-muted-foreground">Optional</span>}>
              <Input
                id="cgpa" type="number" step="0.01" min={0} max={10} placeholder="8.4"
                value={form.cgpa ?? ""}
                onChange={(e) => set("cgpa", e.target.value ? Number(e.target.value) : undefined)}
              />
            </Field>

            <Field id="location" label="Location" error={fields.location} hint={<span className="text-xs text-muted-foreground">Optional</span>}>
              <Input
                id="location" placeholder="Pune, Maharashtra"
                value={form.location} onChange={(e) => set("location", e.target.value)}
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Career interests</CardTitle>
            <CardDescription>
              Pick up to eight. These weight your career recommendations — you can change them any time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((interest) => {
                const active = form.careerInterests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    aria-pressed={active}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm transition-colors",
                      active
                        ? "border-primary bg-primary/10 font-medium text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    {interest}
                  </button>
                );
              })}
            </div>
            {form.careerInterests.length > 0 && (
              <p className="mt-3 text-xs text-muted-foreground">
                <Badge variant="muted">{form.careerInterests.length} selected</Badge>
              </p>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            Continue
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
