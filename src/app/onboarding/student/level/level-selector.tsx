"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ClipboardCheck, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FormAlert } from "@/components/auth/form-field";
import { Stepper, STUDENT_STEPS } from "@/components/shell/stepper";
import { DomainIcon } from "@/components/student/domain-icon";
import { postJson } from "@/lib/client";
import { cn } from "@/lib/utils";

type Level = "beginner" | "intermediate" | "advanced";

const LEVELS: Array<{ value: Level; title: string; definition: string; test: string }> = [
  {
    value: "beginner",
    title: "Beginner",
    definition: "I have little to no knowledge of this subject.",
    test: "No test — straight to the beginner path",
  },
  {
    value: "intermediate",
    title: "Intermediate",
    definition: "I have already learned some parts of this subject but haven't completed or mastered the full course.",
    test: "Short diagnostic to find your real starting point",
  },
  {
    value: "advanced",
    title: "Advanced",
    definition: "I have completed the course before, but I don't have a strong grip on the subject.",
    test: "Diagnostic confirms mastery before we skip ahead",
  },
];

interface DomainRow {
  id: string;
  name: string;
  icon: string;
  gradient: string;
  currentLevel: Level | null;
}

export function LevelSelector({ domains }: { domains: DomainRow[] }) {
  const router = useRouter();
  const [levels, setLevels] = React.useState<Record<string, Level>>(() =>
    Object.fromEntries(domains.map((d) => [d.id, d.currentLevel ?? "beginner"])),
  );
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string>();

  const needsTest = domains.filter((d) => levels[d.id] !== "beginner");

  async function onContinue() {
    setPending(true);
    setError(undefined);

    const result = await postJson<{ next?: string; needsAssessment?: string[] }>(
      "/api/onboarding/student/levels",
      { levels },
    );
    if (!result.ok) {
      setError(result.error ?? "Could not save your levels.");
      setPending(false);
      return;
    }
    router.push(result.data.next ?? "/onboarding/student/personalized-path");
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <Stepper steps={STUDENT_STEPS} current="level" />

      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">What is your current level?</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Set this per domain — you might be advanced in one and starting from scratch in another. Your answer is a
          starting hypothesis: for intermediate and advanced, a diagnostic decides where you actually begin.
        </p>
      </div>

      {error && <FormAlert tone="error">{error}</FormAlert>}

      <div className="space-y-5">
        {domains.map((domain) => (
          <div key={domain.id} className="rounded-2xl border bg-card p-5">
            <div className="flex items-center gap-3">
              <span className={cn("flex size-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm", domain.gradient)}>
                <DomainIcon name={domain.icon} className="size-4.5 h-[18px] w-[18px]" />
              </span>
              <div>
                <h2 className="font-semibold">{domain.name}</h2>
                <p className="text-xs text-muted-foreground">
                  {levels[domain.id] === "beginner"
                    ? "You'll start at the beginning of the track."
                    : "You'll take a short diagnostic for this domain."}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
              {LEVELS.map((level) => {
                const active = levels[domain.id] === level.value;
                return (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() => setLevels((prev) => ({ ...prev, [domain.id]: level.value }))}
                    aria-pressed={active}
                    className={cn(
                      "flex flex-col rounded-xl border p-3.5 text-left transition-all",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      active ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-accent/50",
                    )}
                  >
                    <span className="flex items-center justify-between">
                      <span className={cn("text-sm font-semibold", active && "text-primary")}>{level.title}</span>
                      {active && <span className="size-2 rounded-full bg-primary" aria-hidden />}
                    </span>
                    <span className="mt-1.5 text-xs text-muted-foreground">{level.definition}</span>
                    <span className="mt-2.5 flex items-center gap-1.5 border-t pt-2.5 text-[11px] text-muted-foreground">
                      {level.value === "beginner"
                        ? <Sparkles className="size-3 shrink-0" />
                        : <ClipboardCheck className="size-3 shrink-0" />}
                      {level.test}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-2xl border bg-background/95 p-4 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          {needsTest.length === 0 ? (
            "No diagnostic needed — we'll build your beginner paths straight away."
          ) : (
            <span className="flex flex-wrap items-center gap-1.5">
              Diagnostic required for
              {needsTest.map((d) => <Badge key={d.id} variant="secondary">{d.name}</Badge>)}
            </span>
          )}
        </div>
        <Button size="lg" onClick={onContinue} disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          {needsTest.length ? "Start diagnostic" : "Build my path"}
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
