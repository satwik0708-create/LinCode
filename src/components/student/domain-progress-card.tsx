import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DomainIcon } from "@/components/student/domain-icon";
import { cn } from "@/lib/utils";
import type { DomainSnapshot } from "@/lib/services/student";

/**
 * One enrolled domain. Progress is per domain by design — a completed domain
 * shows as completed without touching any of the others.
 */
export function DomainProgressCard({ snapshot }: { snapshot: DomainSnapshot }) {
  const { enrollment } = snapshot;
  const completed = enrollment.status === "completed";
  const notStarted = enrollment.progress === 0 && enrollment.status === "not_started";

  return (
    <Card className="flex flex-col overflow-hidden">
      <span className={cn("h-1 w-full bg-gradient-to-r", snapshot.gradient)} aria-hidden />
      <CardContent className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <span className={cn("flex size-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm", snapshot.gradient)}>
            <DomainIcon name={snapshot.icon} className="size-4.5 h-[18px] w-[18px]" />
          </span>
          {completed ? (
            <Badge variant="success" className="gap-1">
              <CheckCircle2 className="size-3" />
              Completed
            </Badge>
          ) : notStarted ? (
            <Badge variant="muted">Not started</Badge>
          ) : (
            <Badge variant="secondary" className="capitalize">
              {enrollment.placedLevel ?? enrollment.declaredLevel}
            </Badge>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-semibold">{snapshot.domainName}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {snapshot.completedModules} of {snapshot.totalModules} modules
            {enrollment.placementScore !== null && ` · placed at ${enrollment.placementScore}%`}
          </p>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold tabular-nums">{enrollment.progress}%</span>
          </div>
          <Progress
            value={enrollment.progress}
            indicatorClassName={completed ? "bg-success" : undefined}
          />
        </div>

        {snapshot.nextModuleTitle && !completed && (
          <p className="rounded-lg bg-muted px-2.5 py-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Next: </span>
            {snapshot.nextModuleTitle}
          </p>
        )}

        <Button asChild variant={completed ? "outline" : "default"} size="sm" className="w-full">
          <Link href={`/student/learning/${enrollment.domainId}`}>
            {completed ? "Review" : notStarted ? "Start learning" : "Continue"}
            <ArrowRight className="size-3.5" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
