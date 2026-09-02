"use client";

import * as React from "react";
import { CheckCircle2, Circle, Clock, ExternalLink, Loader2, Lock, SkipForward } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { postJson } from "@/lib/client";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export interface PathStepView {
  moduleId: string;
  title: string;
  summary: string;
  level: "beginner" | "intermediate" | "advanced";
  estimatedMinutes: number;
  skills: string[];
  status: "skip" | "recommended" | "locked";
  rationale: string;
  completed: boolean;
  resources: Array<{ id: string; title: string; type: string; provider: string; url: string; minutes: number }>;
}

/**
 * Renders the personalised sequence for one domain. Steps the engine marked
 * "skip" stay visible with their reason — a student should be able to see what
 * was skipped on their behalf and why, and open it anyway.
 */
export function LearningPathView({
  domainId,
  steps,
  interactive = true,
}: {
  domainId: string;
  steps: PathStepView[];
  interactive?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<string>();
  const [expanded, setExpanded] = React.useState<string>();

  async function complete(moduleId: string, status: "completed" | "in_progress") {
    setBusy(moduleId);
    await postJson("/api/learning/progress", { domainId, moduleId, status, minutes: 30 });
    setBusy(undefined);
    router.refresh();
  }

  const recommended = steps.filter((s) => s.status !== "skip");
  const skipped = steps.filter((s) => s.status === "skip");

  return (
    <div className="space-y-6">
      {skipped.length > 0 && (
        <Card className="border-dashed">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <SkipForward className="size-4 text-muted-foreground" />
              <p className="text-sm font-medium">
                {skipped.length} {skipped.length === 1 ? "module" : "modules"} skipped for you
              </p>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              You already demonstrated these — they don&rsquo;t count against your progress, but you can still open them.
            </p>
            <ul className="mt-3 space-y-2">
              {skipped.map((step) => (
                <li key={step.moduleId} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-xs">
                  <CheckCircle2 className="size-3.5 shrink-0 translate-y-0.5 text-success" />
                  <span className="font-medium text-foreground">{step.title}</span>
                  <span className="text-muted-foreground">{step.rationale}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <ol className="space-y-3">
        {recommended.map((step, position) => {
          const open = expanded === step.moduleId;
          const locked = step.status === "locked";
          return (
            <li key={step.moduleId}>
              <Card className={cn("overflow-hidden transition-colors", step.completed && "bg-success/[0.04]", locked && "opacity-70")}>
                <div className="flex gap-4 p-4 sm:p-5">
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold tabular-nums",
                        step.completed
                          ? "border-success bg-success text-success-foreground"
                          : locked
                            ? "border-border text-muted-foreground"
                            : "border-primary bg-primary/10 text-primary",
                      )}
                    >
                      {step.completed ? <CheckCircle2 className="size-4" /> : locked ? <Lock className="size-3.5" /> : position + 1}
                    </span>
                    {position < recommended.length - 1 && <span className="mt-1 w-px flex-1 bg-border" aria-hidden />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className={cn("font-medium", step.completed && "text-muted-foreground line-through decoration-muted-foreground/40")}>
                          {step.title}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">{step.summary}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <Badge variant="muted" className="capitalize">{step.level}</Badge>
                        <Badge variant="muted" className="gap-1">
                          <Clock className="size-3" />
                          {Math.round(step.estimatedMinutes / 60)}h
                        </Badge>
                      </div>
                    </div>

                    <p className={cn(
                      "mt-2 rounded-lg px-2.5 py-1.5 text-xs",
                      locked ? "bg-muted text-muted-foreground" : "bg-primary/[0.06] text-primary",
                    )}>
                      {step.rationale}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      {step.skills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-[11px]">{skill}</Badge>
                      ))}
                    </div>

                    {interactive && (
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          variant={open ? "secondary" : "outline"}
                          onClick={() => setExpanded(open ? undefined : step.moduleId)}
                          aria-expanded={open}
                        >
                          {open ? "Hide resources" : `${step.resources.length} resources`}
                        </Button>
                        {!step.completed ? (
                          <Button size="sm" onClick={() => complete(step.moduleId, "completed")} disabled={busy === step.moduleId || locked}>
                            {busy === step.moduleId && <Loader2 className="size-3.5 animate-spin" />}
                            Mark complete
                          </Button>
                        ) : (
                          <Button size="sm" variant="ghost" onClick={() => complete(step.moduleId, "in_progress")} disabled={busy === step.moduleId}>
                            {busy === step.moduleId && <Loader2 className="size-3.5 animate-spin" />}
                            Reopen
                          </Button>
                        )}
                      </div>
                    )}

                    {open && (
                      <ul className="mt-3 space-y-2 border-t pt-3">
                        {step.resources.map((resource) => (
                          <li key={resource.id}>
                            <a
                              href={resource.url}
                              target={resource.url.startsWith("http") ? "_blank" : undefined}
                              rel={resource.url.startsWith("http") ? "noopener noreferrer" : undefined}
                              className="flex items-start gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-accent"
                            >
                              <Circle className="mt-1.5 size-1.5 shrink-0 fill-current text-muted-foreground" />
                              <span className="min-w-0 flex-1">
                                <span className="font-medium">{resource.title}</span>
                                <span className="ml-2 text-xs text-muted-foreground">
                                  {resource.provider} · {resource.type} · {resource.minutes} min
                                </span>
                              </span>
                              {resource.url.startsWith("http") && <ExternalLink className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />}
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </Card>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
