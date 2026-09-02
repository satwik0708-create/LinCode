import Link from "next/link";
import { Check, CircleAlert, Clock, MapPin, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn, relativeDays } from "@/lib/utils";
import type { MatchedOpportunity } from "@/lib/services/student";

const VERDICT_ICON = { met: Check, partial: CircleAlert, missing: X } as const;

/**
 * An opportunity with its skill-compatibility breakdown. The match is not a
 * single opaque number — every requirement shows what was expected, what the
 * student has, and whether it counts as met.
 */
export function OpportunityCard({
  entry, organizationName, action,
}: {
  entry: MatchedOpportunity;
  organizationName: string;
  action?: React.ReactNode;
}) {
  const { opportunity, match, applied } = entry;

  return (
    <Card className="flex flex-col">
      <CardContent className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="muted" className="capitalize">{opportunity.type}</Badge>
              {applied && <Badge variant="success">Applied</Badge>}
              {!match.eligible && <Badge variant="warning">Eligibility check</Badge>}
            </div>
            <h3 className="mt-2 font-semibold leading-tight">{opportunity.title}</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">{organizationName}</p>
          </div>

          <div className="shrink-0 text-right">
            <p
              className={cn(
                "text-2xl font-semibold tabular-nums leading-none",
                match.matchScore >= 75 ? "text-success" : match.matchScore >= 50 ? "text-warning" : "text-muted-foreground",
              )}
            >
              {match.matchScore}%
            </p>
            <p className="text-[11px] text-muted-foreground">skill match</p>
          </div>
        </div>

        <Progress
          value={match.matchScore}
          className="h-1.5"
          indicatorClassName={match.matchScore >= 75 ? "bg-success" : match.matchScore >= 50 ? "bg-warning" : "bg-muted-foreground/50"}
        />

        <p className="line-clamp-2 text-sm text-muted-foreground">{opportunity.description}</p>

        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><MapPin className="size-3" />{opportunity.location} · {opportunity.workMode}</span>
          <span className="flex items-center gap-1"><Clock className="size-3" />Closes {relativeDays(opportunity.deadline)}</span>
          {opportunity.stipend && <span>{opportunity.stipend}</span>}
          {opportunity.salaryLpa && <span>{opportunity.salaryLpa}</span>}
        </div>

        <div className="space-y-1.5 border-t pt-3">
          <p className="text-xs font-medium">Required skills</p>
          <ul className="flex flex-wrap gap-1.5">
            {match.breakdown.map((req) => {
              const Icon = VERDICT_ICON[req.verdict];
              return (
                <li key={req.skillId}>
                  <span
                    title={`You: ${req.have}% · Required: ${req.required}%`}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px]",
                      req.verdict === "met" && "border-success/30 bg-success/10 text-success",
                      req.verdict === "partial" && "border-warning/30 bg-warning/10 text-warning",
                      req.verdict === "missing" && "border-destructive/30 bg-destructive/10 text-destructive",
                    )}
                  >
                    <Icon className="size-3" />
                    {req.skillName}
                    {req.mandatory && <span className="opacity-70">*</span>}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        {!match.eligible && match.ineligibleReasons.length > 0 && (
          <p className="rounded-lg bg-warning/10 px-2.5 py-2 text-xs text-warning">
            {match.ineligibleReasons.join(" ")}
          </p>
        )}

        <div className="mt-auto flex items-center gap-2 pt-1">
          {action ?? (
            <Button asChild size="sm" variant="outline" className="w-full">
              <Link href={`/student/internships/${opportunity.id}`}>View details</Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
