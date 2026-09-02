import { ArrowUpRight, Minus, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SkillGapEntry, SkillGapReport } from "@/lib/types";

const GROUPS = [
  { key: "strong", title: "Strong", hint: "Meeting or exceeding what roles expect", icon: TrendingUp, tone: "success" },
  { key: "developing", title: "Developing", hint: "On the way — worth consolidating", icon: Minus, tone: "warning" },
  { key: "needsImprovement", title: "Needs improvement", hint: "Below the bar for most postings", icon: TrendingDown, tone: "destructive" },
  { key: "missing", title: "Not yet started", hint: "No evidence recorded yet", icon: ArrowUpRight, tone: "muted" },
] as const;

export function SkillGapView({ report, domainName }: { report: SkillGapReport; domainName: string }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle>Your skill gap — {domainName}</CardTitle>
              <CardDescription className="mt-1.5 max-w-2xl">{report.summary}</CardDescription>
            </div>
            <div className="rounded-xl border bg-muted/40 px-4 py-3 text-center">
              <p className="text-xs text-muted-foreground">Readiness</p>
              <p className="text-3xl font-semibold tabular-nums">{report.readinessScore}%</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress
            value={report.readinessScore}
            className="h-2.5"
            indicatorClassName={
              report.readinessScore >= 70 ? "bg-success" : report.readinessScore >= 40 ? "bg-warning" : "bg-destructive"
            }
          />
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>Starting out</span>
            <span>Interview ready</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {GROUPS.map((group) => {
          const entries = report[group.key] as SkillGapEntry[];
          if (entries.length === 0) return null;
          return (
            <Card key={group.key}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "flex size-8 items-center justify-center rounded-lg",
                      group.tone === "success" && "bg-success/12 text-success",
                      group.tone === "warning" && "bg-warning/15 text-warning",
                      group.tone === "destructive" && "bg-destructive/12 text-destructive",
                      group.tone === "muted" && "bg-muted text-muted-foreground",
                    )}
                  >
                    <group.icon className="size-4" />
                  </span>
                  <div>
                    <CardTitle className="text-base">{group.title}</CardTitle>
                    <CardDescription className="text-xs">{group.hint}</CardDescription>
                  </div>
                  <Badge variant="muted" className="ml-auto">{entries.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {entries.map((entry) => (
                  <SkillRow key={entry.skillId} entry={entry} tone={group.tone} />
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function SkillRow({ entry, tone }: { entry: SkillGapEntry; tone: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="truncate font-medium">{entry.skillName}</span>
        <span className="shrink-0 tabular-nums text-xs text-muted-foreground">
          {entry.currentScore}% <span className="opacity-60">/ {entry.requiredScore}%</span>
        </span>
      </div>
      <div className="relative">
        <Progress
          value={entry.currentScore}
          className="h-1.5"
          indicatorClassName={cn(
            tone === "success" && "bg-success",
            tone === "warning" && "bg-warning",
            tone === "destructive" && "bg-destructive",
            tone === "muted" && "bg-muted-foreground/40",
          )}
        />
        {/* Target marker so the required level is visible, not just implied. */}
        <span
          className="absolute top-1/2 h-3 w-px -translate-y-1/2 bg-foreground/40"
          style={{ left: `${entry.requiredScore}%` }}
          aria-hidden
        />
      </div>
      {entry.gap > 0 && (
        <p className="text-[11px] text-muted-foreground">{entry.gap}-point gap to close</p>
      )}
    </div>
  );
}
