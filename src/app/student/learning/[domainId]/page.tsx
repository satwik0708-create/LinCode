import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import { getEnrollment } from "@/lib/data/learning";
import { getDomain } from "@/lib/domain/domains";
import { getPathView, getSkillGap } from "@/lib/services/student";
import { PageHeader } from "@/components/shell/page-header";
import { LearningPathView } from "@/components/student/learning-path-view";
import { SkillGapView } from "@/components/student/skill-gap-view";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RegeneratePathButton } from "./regenerate-button";

export async function generateMetadata({ params }: { params: Promise<{ domainId: string }> }): Promise<Metadata> {
  const { domainId } = await params;
  return { title: getDomain(domainId)?.name ?? "Learning" };
}

export default async function DomainLearningPage({ params }: { params: Promise<{ domainId: string }> }) {
  const { domainId } = await params;
  const user = await requireRole("student");

  const domain = getDomain(domainId);
  if (!domain) notFound();

  // Enrollment is the authorisation check here: a student cannot open a path
  // for a domain they never enrolled in by editing the URL.
  const enrollment = await getEnrollment(user.id, domainId);
  if (!enrollment) notFound();

  const [view, gap] = await Promise.all([getPathView(user.id, domainId), getSkillGap(user.id, domainId)]);

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link href="/student/learning"><ArrowLeft className="size-4" />My Learning</Link>
      </Button>

      <PageHeader
        title={domain.name}
        description={domain.description}
        actions={
          <>
            <Badge variant="secondary" className="capitalize">
              {enrollment.placedLevel ?? enrollment.declaredLevel} track
            </Badge>
            <RegeneratePathButton domainId={domainId} />
          </>
        }
      />

      <Card>
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium">Domain progress</span>
              <span className="tabular-nums text-muted-foreground">{enrollment.progress}%</span>
            </div>
            <Progress
              value={enrollment.progress}
              className="mt-2"
              indicatorClassName={enrollment.status === "completed" ? "bg-success" : undefined}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              {view?.steps.filter((s) => s.completed).length ?? 0} of{" "}
              {view?.steps.filter((s) => s.status !== "skip").length ?? 0} recommended modules complete
              {enrollment.placementScore !== null && ` · diagnostic score ${enrollment.placementScore}%`}
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="path">
        <TabsList>
          <TabsTrigger value="path">Learning path</TabsTrigger>
          <TabsTrigger value="gap">Skill gap</TabsTrigger>
          <TabsTrigger value="about">About this domain</TabsTrigger>
        </TabsList>

        <TabsContent value="path">
          {view ? (
            <LearningPathView domainId={domainId} steps={view.steps} />
          ) : (
            <Card><CardContent className="p-6 text-sm text-muted-foreground">No path generated yet.</CardContent></Card>
          )}
        </TabsContent>

        <TabsContent value="gap">
          {gap ? <SkillGapView report={gap} domainName={domain.name} /> : null}
        </TabsContent>

        <TabsContent value="about" className="space-y-4">
          <Card>
            <CardContent className="space-y-4 p-5">
              <div>
                <p className="text-sm font-medium">Roles this domain leads to</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {domain.roles.map((role) => <Badge key={role} variant="secondary">{role}</Badge>)}
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Metric label="Typical duration" value={`~${domain.estimatedWeeks} weeks`} />
                <Metric label="Industry demand" value={`${domain.industryDemand}/100`} />
                <Metric label="Median salary" value={`₹${domain.averageSalaryLpa} LPA`} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <RefreshCw className="size-3" />
        Your path updates automatically as you complete modules or retake a diagnostic.
      </p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-muted/40 p-3.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-semibold">{value}</p>
    </div>
  );
}
