import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import { getInstitutionAnalytics } from "@/lib/services/institution";
import { PageHeader } from "@/components/shell/page-header";
import { StatCard } from "@/components/shell/stat-card";
import { BarList } from "@/components/shell/bar-list";
import { EmptyState } from "@/components/shell/empty-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Institution Dashboard" };

export default async function InstitutionDashboard() {
  const user = await requireRole("institution");
  if (!user.institutionId) {
    return (
      <EmptyState
        icon="Building2"
        title="Finish your institution profile"
        description="Link your account to an institution to see cohort analytics."
        action={<Button asChild><Link href="/onboarding/institution/profile">Complete profile</Link></Button>}
      />
    );
  }

  const analytics = await getInstitutionAnalytics(user.institutionId);

  return (
    <div className="space-y-8">
      <PageHeader
        title={analytics.institutionName}
        description="Skill development, internship participation and placement progress across your cohort. Scoped to your institution only."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Students" value={analytics.totals.students} icon="Users" hint={`${analytics.totals.enrolled} enrolled in a domain`} />
        <StatCard label="Average readiness" value={`${analytics.averageReadiness}%`} icon="Target" tone={analytics.averageReadiness >= 60 ? "success" : "warning"} />
        <StatCard label="Applied to opportunities" value={analytics.totals.applied} icon="Briefcase" hint={`${analytics.totals.interviewing} in interviews`} />
        <StatCard label="Placement rate" value={`${analytics.placementRate}%`} icon="Building2" tone="success" hint={`${analytics.totals.placed} with offers`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Department readiness</CardTitle>
            <CardDescription>Average placement readiness by branch.</CardDescription>
          </CardHeader>
          <CardContent>
            <BarList
              max={100}
              suffix="%"
              rows={analytics.byDepartment.map((d) => ({
                label: d.branch,
                value: d.averageReadiness,
                hint: `${d.students} students · ${d.applications} applications · ${d.offers} offers`,
                tone: d.averageReadiness >= 70 ? "success" : d.averageReadiness >= 45 ? "warning" : "destructive",
              }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Application funnel</CardTitle>
            <CardDescription>Cumulative — each stage counts everyone who reached it or beyond.</CardDescription>
          </CardHeader>
          <CardContent>
            <BarList rows={analytics.applicationFunnel.map((s) => ({ label: s.label, value: s.count }))} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Most common skill gaps</CardTitle>
            <CardDescription>Students below the 60% industry bar, by skill.</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.topGaps.length === 0 ? (
              <p className="text-sm text-muted-foreground">No gaps recorded yet.</p>
            ) : (
              <BarList
                rows={analytics.topGaps.map((gap) => ({
                  label: gap.skillName,
                  value: gap.affected,
                  hint: `Cohort average ${gap.averageScore}%`,
                  tone: "destructive",
                }))}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent placement activity</CardTitle>
            <CardDescription>Latest movement across your students&rsquo; applications.</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              <ul className="divide-y">
                {analytics.recentActivity.map((activity, index) => (
                  <li key={index} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{activity.studentName}</p>
                      <p className="truncate text-xs text-muted-foreground">{activity.title}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <Badge variant="muted">{activity.stage}</Badge>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{formatDate(activity.at)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline"><Link href="/institution/students">Student progress<ArrowRight className="size-3.5" /></Link></Button>
        <Button asChild variant="outline"><Link href="/institution/skills">Skill development<ArrowRight className="size-3.5" /></Link></Button>
        <Button asChild variant="outline"><Link href="/institution/placements">Placements<ArrowRight className="size-3.5" /></Link></Button>
        <Button asChild variant="outline"><Link href="/institution/analytics">Full analytics<ArrowRight className="size-3.5" /></Link></Button>
      </div>
    </div>
  );
}
