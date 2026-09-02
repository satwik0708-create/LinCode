import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/guard";
import { getInstitutionAnalytics } from "@/lib/services/institution";
import { PageHeader } from "@/components/shell/page-header";
import { StatCard } from "@/components/shell/stat-card";
import { BarList } from "@/components/shell/bar-list";
import { EmptyState } from "@/components/shell/empty-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export const metadata: Metadata = { title: "Skill Development" };

export default async function InstitutionSkillsPage() {
  const user = await requireRole("institution");
  if (!user.institutionId) {
    return (
      <EmptyState
        icon="Building2"
        title="Finish your institution profile"
        description="Link your account to an institution to see skill analytics."
        action={<Button asChild><Link href="/onboarding/institution/profile">Complete profile</Link></Button>}
      />
    );
  }

  const analytics = await getInstitutionAnalytics(user.institutionId);

  // Where the cohort is weak against what employers are asking for loudest.
  const gapByName = new Map(analytics.topGaps.map((g) => [g.skillId, g]));
  const priority = analytics.industryDemand
    .map((demand) => ({ ...demand, gap: gapByName.get(demand.skillId) }))
    .filter((row) => row.gap)
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Skill development"
        description="How your cohort's skills are developing, where the gaps concentrate, and how that lines up with what industry is currently asking for."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Students assessed" value={analytics.totals.assessed} icon="ClipboardCheck" hint={`of ${analytics.totals.students} registered`} />
        <StatCard label="Enrolled in a domain" value={analytics.totals.enrolled} icon="BookOpen" />
        <StatCard label="Average readiness" value={`${analytics.averageReadiness}%`} icon="Target" tone={analytics.averageReadiness >= 60 ? "success" : "warning"} />
        <StatCard label="Skills below the bar" value={analytics.topGaps.length} icon="LineChart" tone="destructive" hint="Tracked cohort-wide" />
      </div>

      {priority.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Training priorities</CardTitle>
            <CardDescription>
              Skills employers ask for most where your cohort is furthest behind — the highest-return interventions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {priority.map((row) => (
              <div key={row.skillId} className="space-y-1.5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium">{row.skillName}</span>
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="muted">{row.postings} open postings</Badge>
                    <Badge variant="destructive">{row.gap!.affected} students below 60%</Badge>
                  </span>
                </div>
                <Progress
                  value={row.gap!.averageScore}
                  indicatorClassName={row.gap!.averageScore >= 60 ? "bg-warning" : "bg-destructive"}
                />
                <p className="text-xs text-muted-foreground">Cohort average {row.gap!.averageScore}%</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Domain adoption</CardTitle>
            <CardDescription>How many students are enrolled in each learning domain.</CardDescription>
          </CardHeader>
          <CardContent>
            <BarList
              rows={analytics.domainAdoption.map((domain) => ({
                label: domain.name,
                value: domain.enrolled,
                hint: `${domain.completed} completed · ${domain.averageProgress}% average progress`,
              }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Industry skill demand</CardTitle>
            <CardDescription>Skills required across open postings on the platform.</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.industryDemand.length === 0 ? (
              <p className="text-sm text-muted-foreground">No open postings to analyse.</p>
            ) : (
              <BarList
                rows={analytics.industryDemand.map((d) => ({ label: d.skillName, value: d.postings, hint: "open postings requiring this skill" }))}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
