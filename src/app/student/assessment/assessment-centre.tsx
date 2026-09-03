"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { History, Play } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AssessmentRunner } from "@/components/student/assessment-runner";
import { DomainIcon } from "@/components/student/domain-icon";
import { EmptyState } from "@/components/shell/empty-state";
import { cn, formatDate } from "@/lib/utils";

type Level = "beginner" | "intermediate" | "advanced";

interface DomainRow {
  id: string;
  name: string;
  icon: string;
  gradient: string;
  declaredLevel: "beginner" | "intermediate" | "advanced";
  placedLevel: "beginner" | "intermediate" | "advanced" | null;
  placementScore: number | null;
  attempts: number;
  lastScore: number | null;
  lastTakenAt: string | null;
}

export function AssessmentCentre({ domains, initialDomain }: { domains: DomainRow[]; initialDomain?: string }) {
  const router = useRouter();
  const [running, setRunning] = React.useState<DomainRow | undefined>(
    initialDomain ? domains.find((d) => d.id === initialDomain) : undefined,
  );
  // Level is per domain: a student can be advanced in one and a beginner in
  // another, so one shared value was both wrong and confusing.
  const [levels, setLevels] = React.useState<Record<string, Level>>(() =>
    Object.fromEntries(domains.map((d) => [d.id, d.declaredLevel])),
  );
  const levelFor = (id: string): Level => levels[id] ?? "intermediate";

  if (domains.length === 0) {
    return (
      <EmptyState
        icon="ClipboardCheck"
        title="Nothing to assess yet"
        description="Enrol in a learning domain first — the diagnostic is built from that domain's competency map."
        action={<Button onClick={() => router.push("/student/learning")}>Browse domains</Button>}
      />
    );
  }

  if (running) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Button variant="ghost" size="sm" className="-ml-2" onClick={() => setRunning(undefined)}>
          Back to assessments
        </Button>
        <AssessmentRunner
          key={`${running.id}-${levelFor(running.id)}`}
          domainId={running.id}
          domainName={running.name}
          declaredLevel={levelFor(running.id)}
          completeLabel="Back to assessments"
          onComplete={() => { setRunning(undefined); router.refresh(); }}
        />
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {domains.map((domain) => (
        <Card key={domain.id} className="flex flex-col overflow-hidden">
          <span className={cn("h-1 w-full bg-gradient-to-r", domain.gradient)} aria-hidden />
          <CardContent className="flex flex-1 flex-col gap-3 p-5">
            <div className="flex items-start justify-between gap-3">
              <span className={cn("flex size-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm", domain.gradient)}>
                <DomainIcon name={domain.icon} className="size-4.5 h-[18px] w-[18px]" />
              </span>
              {domain.placedLevel ? (
                <Badge variant="secondary" className="capitalize">Placed: {domain.placedLevel}</Badge>
              ) : (
                <Badge variant="warning">Not assessed</Badge>
              )}
            </div>

            <div className="flex-1">
              <h3 className="font-semibold">{domain.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {domain.attempts === 0
                  ? "No attempts yet"
                  : `${domain.attempts} ${domain.attempts === 1 ? "attempt" : "attempts"} · last ${domain.lastScore}%`}
              </p>
              {domain.lastTakenAt && (
                <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                  <History className="size-3" />
                  {formatDate(domain.lastTakenAt)}
                </p>
              )}
            </div>

            <div>
              <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">Assess me as</p>
              <div className="grid grid-cols-3 gap-1.5">
                {(["beginner", "intermediate", "advanced"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setLevels((prev) => ({ ...prev, [domain.id]: option }))}
                    aria-pressed={levelFor(domain.id) === option}
                    className={cn(
                      "rounded-lg border px-2 py-1.5 text-[11px] font-medium capitalize transition-colors",
                      levelFor(domain.id) === option
                        ? "border-primary bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent",
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {/*
              Every level is takeable here, beginner included. Enrolling as a
              beginner still skips the test — but a beginner who wants to prove
              what they already know should not be told no, and the per-skill
              result is what lets their path skip modules they have covered.
            */}
            <Button size="sm" className="w-full" onClick={() => setRunning(domain)}>
              <Play className="size-3.5" />
              {levelFor(domain.id) === "beginner" ? "Take the beginner test" : "Start diagnostic"}
            </Button>
            {levelFor(domain.id) === "beginner" && (
              <p className="text-[11px] text-muted-foreground">
                Optional — it cannot move you up a track, but anything you prove is marked skippable on your path.
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
