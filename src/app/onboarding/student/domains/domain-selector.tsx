"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FormAlert } from "@/components/auth/form-field";
import { Stepper, STUDENT_STEPS } from "@/components/shell/stepper";
import { DomainIcon } from "@/components/student/domain-icon";
import { postJson } from "@/lib/client";
import { cn } from "@/lib/utils";

export interface DomainOption {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  gradient: string;
  estimatedWeeks: number;
  industryDemand: number;
  roles: string[];
  topSkills: string[];
  moduleCount: number;
}

export function DomainSelector({ domains, preselected }: { domains: DomainOption[]; preselected: string[] }) {
  const router = useRouter();
  const [selected, setSelected] = React.useState<string[]>(preselected);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string>();

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]));
  }

  async function onContinue() {
    if (selected.length === 0) return;
    setPending(true);
    setError(undefined);

    const result = await postJson<{ next?: string }>("/api/onboarding/student/domains", { domainIds: selected });
    if (!result.ok) {
      setError(result.error ?? "Could not save your selection.");
      setPending(false);
      return;
    }
    router.push(result.data.next ?? "/onboarding/student/level");
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <Stepper steps={STUDENT_STEPS} current="domains" />

      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">What do you want to learn?</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Choose one domain or several — progress is tracked separately for each, so finishing one never closes the
          others. You can add more domains at any time from My Learning.
        </p>
      </div>

      {error && <FormAlert tone="error">{error}</FormAlert>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {domains.map((domain) => {
          const active = selected.includes(domain.id);
          return (
            <button
              key={domain.id}
              type="button"
              onClick={() => toggle(domain.id)}
              aria-pressed={active}
              className={cn(
                "group relative flex flex-col overflow-hidden rounded-2xl border bg-card p-5 text-left transition-all",
                "hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                active ? "border-primary shadow-md ring-1 ring-primary" : "border-border",
              )}
            >
              <span className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", domain.gradient)} aria-hidden />

              <div className="flex items-start justify-between gap-3">
                <span className={cn("flex size-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm", domain.gradient)}>
                  <DomainIcon name={domain.icon} />
                </span>
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full border transition-all",
                    active ? "border-primary bg-primary text-primary-foreground" : "border-border",
                  )}
                  aria-hidden
                >
                  {active && <Check className="size-3.5" />}
                </span>
              </div>

              <h2 className="mt-4 font-semibold">{domain.name}</h2>
              <p className="mt-1 text-xs font-medium text-primary">{domain.tagline}</p>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">{domain.description}</p>

              <div className="mt-4 space-y-3 border-t pt-4">
                <div className="flex flex-wrap gap-1.5">
                  {domain.topSkills.slice(0, 4).map((skill) => (
                    <Badge key={skill} variant="muted" className="text-[11px]">{skill}</Badge>
                  ))}
                  {domain.topSkills.length > 4 && (
                    <Badge variant="muted" className="text-[11px]">+{domain.moduleCount - 4} more</Badge>
                  )}
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Beginner → Advanced · ~{domain.estimatedWeeks} weeks</span>
                  <span>Demand {domain.industryDemand}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-2xl border bg-background/95 p-4 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {selected.length === 0
            ? "Select at least one domain to continue."
            : `${selected.length} ${selected.length === 1 ? "domain" : "domains"} selected — you'll set a level for each next.`}
        </p>
        <Button size="lg" onClick={onContinue} disabled={selected.length === 0 || pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          Continue
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
