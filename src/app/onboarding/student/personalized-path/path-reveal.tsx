"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Stepper, STUDENT_STEPS } from "@/components/shell/stepper";
import { SkillGapView } from "@/components/student/skill-gap-view";
import { LearningPathView, type PathStepView } from "@/components/student/learning-path-view";
import { DomainIcon } from "@/components/student/domain-icon";
import { FormAlert } from "@/components/auth/form-field";
import { postJson } from "@/lib/client";
import { cn } from "@/lib/utils";
import type { SkillGapReport } from "@/lib/types";

interface DomainResult {
  id: string;
  name: string;
  gradient: string;
  icon: string;
  placedLevel: string;
  placementScore: number | null;
  gap: SkillGapReport | null;
  steps: PathStepView[];
}

export function PathReveal({ name, domains }: { name: string; domains: DomainResult[] }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string>();

  async function enterDashboard() {
    setPending(true);
    setError(undefined);
    const result = await postJson<{ next?: string }>("/api/onboarding/complete", {});
    if (!result.ok) {
      setError(result.error ?? "Could not finish onboarding.");
      setPending(false);
      return;
    }
    router.replace(result.data.next ?? "/student/dashboard");
    router.refresh();
  }

  const totalRecommended = domains.reduce((sum, d) => sum + d.steps.filter((s) => s.status !== "skip").length, 0);
  const totalSkipped = domains.reduce((sum, d) => sum + d.steps.filter((s) => s.status === "skip").length, 0);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <Stepper steps={STUDENT_STEPS} current="path" />

      <div className="text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Sparkles className="size-6" />
        </span>
        <h1 className="mt-4 text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
          Here&rsquo;s your plan, {name.split(" ")[0]}
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-balance text-sm text-muted-foreground">
          Built from your assessment results, your existing skills and what employers are currently asking for.
          {totalSkipped > 0 && ` We skipped ${totalSkipped} ${totalSkipped === 1 ? "module" : "modules"} you have already proven.`}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryStat label="Domains enrolled" value={String(domains.length)} />
        <SummaryStat label="Modules recommended" value={String(totalRecommended)} />
        <SummaryStat label="Modules skipped" value={String(totalSkipped)} />
      </div>

      <Tabs defaultValue={domains[0]?.id} className="w-full">
        <TabsList className="flex w-full flex-wrap justify-start">
          {domains.map((domain) => (
            <TabsTrigger key={domain.id} value={domain.id} className="gap-2">
              <DomainIcon name={domain.icon} className="size-3.5 h-3.5 w-3.5" />
              <span className="max-w-32 truncate">{domain.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {domains.map((domain) => (
          <TabsContent key={domain.id} value={domain.id} className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={cn("flex size-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm", domain.gradient)}>
                      <DomainIcon name={domain.icon} />
                    </span>
                    <div>
                      <CardTitle className="text-lg">{domain.name}</CardTitle>
                      <CardDescription>
                        Placed on the <strong className="capitalize text-foreground">{domain.placedLevel}</strong> track
                        {domain.placementScore !== null && ` after scoring ${domain.placementScore}%`}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary" className="capitalize">{domain.placedLevel}</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">
                  {domain.steps.filter((s) => s.status !== "skip").length} modules to work through
                  {domain.steps.some((s) => s.status === "skip") &&
                    `, ${domain.steps.filter((s) => s.status === "skip").length} skipped`}
                  .
                </p>
              </CardContent>
            </Card>

            {domain.gap && <SkillGapView report={domain.gap} domainName={domain.name} />}

            <div>
              <h2 className="mb-3 text-lg font-semibold tracking-tight">Your personalised sequence</h2>
              <LearningPathView domainId={domain.id} steps={domain.steps} interactive={false} />
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {error && <FormAlert tone="error">{error}</FormAlert>}

      <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-2xl border bg-background/95 p-4 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          You can add domains, retake a diagnostic or change your level any time from My Learning.
        </p>
        <Button size="lg" onClick={enterDashboard} disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          Enter my dashboard
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card p-4 text-center">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
