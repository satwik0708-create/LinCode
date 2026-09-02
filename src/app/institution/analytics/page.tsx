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

export const metadata: Metadata = { title: "Analytics" };

export default async function InstitutionAnalyticsPage() {
  const user = await requireRole("institution");
  if (!user.institutionId) {
    return (
      <EmptyState
        icon="Building2"
        title="Finish your institution profile"
        description="Link your account to an institution to see analytics."
        action={<Button asChild><Link href="/onboarding/institution/profile">Complete profile</Link></Button>}
      />
    );
  }

  const analytics = await getInstitutionAnalytics(user.institutionId);
  const funnel = analytics.applicationFunnel;
  const conversion = funnel[0]?.count
    ? Math.round(((funnel[funnel.length - 1]?.count ?? 0) / funnel[0].count) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="The full picture: skill development, internship participation, placement outcomes and industry demand trends for your institution."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Cohort size" value={analytics.totals.students} icon="Users" />
        <StatCard label="Assessment coverage" value={`${analytics.totals.students ? Math.round((analytics.totals.assessed / analytics.totals.students) * 100) : 0}%`} icon="ClipboardCheck" hint={`${analytics.totals.assessed} students assessed`} />
        <StatCard label="Application conversion" value={`${conversion}%`} icon="ListChecks" hint="Applied → selected" tone={conversion >= 20 ? "success" : "warning"} />
        <StatCard label="Placement rate" value={`${analytics.placementRate}%`} icon="Building2" tone="success" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recruitment funnel</CardTitle>
            <CardDescription>Cumulative applications reaching each stage.</CardDescription>
          </CardHeader>
          <CardContent>
            <BarList rows={funnel.map((stage) => ({ label: stage.label, value: stage.count }))} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Department comparison</CardTitle>
            <CardDescription>Readiness, applications and offers side by side.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="pb-2 pr-3 font-medium">Branch</th>
                    <th className="pb-2 pr-3 text-right font-medium">Students</th>
                    <th className="pb-2 pr-3 text-right font-medium">Readiness</th>
                    <th className="pb-2 pr-3 text-right font-medium">Applied</th>
                    <th className="pb-2 text-right font-medium">Offers</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {analytics.byDepartment.map((row) => (
                    <tr key={row.branch}>
                      <td className="py-2.5 pr-3 font-medium">{row.branch}</td>
                      <td className="py-2.5 pr-3 text-right tabular-nums">{row.students}</td>
                      <td className="py-2.5 pr-3 text-right">
                        <Badge variant={row.averageReadiness >= 70 ? "success" : row.averageReadiness >= 45 ? "warning" : "destructive"}>
                          {row.averageReadiness}%
                        </Badge>
                      </td>
                      <td className="py-2.5 pr-3 text-right tabular-nums">{row.applications}</td>
                      <td className="py-2.5 text-right tabular-nums">{row.offers}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Domain adoption &amp; completion</CardTitle>
            <CardDescription>Where your students are choosing to build depth.</CardDescription>
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
            <CardTitle className="text-base">Skill demand vs cohort capability</CardTitle>
            <CardDescription>What employers ask for, against where your cohort sits.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics.industryDemand.length === 0 ? (
              <p className="text-sm text-muted-foreground">No open postings to analyse.</p>
            ) : (
              analytics.industryDemand.map((demand) => {
                const gap = analytics.topGaps.find((g) => g.skillId === demand.skillId);
                return (
                  <div key={demand.skillId} className="flex flex-wrap items-baseline justify-between gap-2 border-b pb-2.5 last:border-0 last:pb-0">
                    <span className="text-sm font-medium">{demand.skillName}</span>
                    <span className="flex items-center gap-2 text-xs">
                      <Badge variant="muted">{demand.postings} postings</Badge>
                      {gap ? (
                        <Badge variant={gap.averageScore >= 60 ? "warning" : "destructive"}>
                          cohort {gap.averageScore}%
                        </Badge>
                      ) : (
                        <Badge variant="success">no recorded gap</Badge>
                      )}
                    </span>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
