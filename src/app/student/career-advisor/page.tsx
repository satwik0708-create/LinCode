import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/guard";
import { getStudentProfile } from "@/lib/data/users";
import { buildEngineContext } from "@/lib/services/student";
import { getSkillEngine } from "@/lib/ai";
import { getDomain } from "@/lib/domain/domains";
import { skillName } from "@/lib/domain/skills";
import { PageHeader } from "@/components/shell/page-header";
import { AdvisorChat } from "./advisor-chat";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export const metadata: Metadata = { title: "AI Career Advisor" };

export default async function CareerAdvisorPage() {
  const user = await requireRole("student");
  const [profile, ctx] = await Promise.all([getStudentProfile(user.id), buildEngineContext(user.id)]);

  const careers = ctx ? getSkillEngine().recommendCareers(ctx).slice(0, 5) : [];
  const domains = (profile?.enrollments ?? []).map((e) => ({
    id: e.domainId,
    name: getDomain(e.domainId)?.name ?? e.domainId,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Career Advisor"
        description="Answers are generated from your own data — assessment results, skill matrix, learning progress, career interests and current industry demand. Nothing is invented."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <AdvisorChat domains={domains} studentName={user.name} />

        <div className="min-w-0 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Career fit</CardTitle>
              <CardDescription>Ranked by your current readiness and stated interests.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {careers.length === 0 && (
                <p className="text-sm text-muted-foreground">Take a diagnostic to unlock career recommendations.</p>
              )}
              {careers.map((career) => (
                <div key={`${career.domainId}-${career.role}`} className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-medium">{career.role}</span>
                    <span className="shrink-0 text-xs font-semibold tabular-nums">{career.fitScore}%</span>
                  </div>
                  <Progress
                    value={career.fitScore}
                    className="h-1.5"
                    indicatorClassName={career.fitScore >= 70 ? "bg-success" : career.fitScore >= 45 ? "bg-warning" : undefined}
                  />
                  <p className="text-xs text-muted-foreground">{career.reason}</p>
                  {career.missingSkillIds.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {career.missingSkillIds.slice(0, 3).map((id) => (
                        <Badge key={id} variant="muted" className="text-[10px]">{skillName(id)}</Badge>
                      ))}
                    </div>
                  )}
                  <p className="text-[11px] text-muted-foreground">
                    Demand {career.demandIndex}/100 · median ₹{career.medianSalaryLpa} LPA
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
