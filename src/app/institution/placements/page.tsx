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

export const metadata: Metadata = { title: "Placements" };

const READINESS_BANDS = [
  { label: "Interview ready (70%+)", min: 70, tone: "success" as const },
  { label: "Developing (45–69%)", min: 45, tone: "warning" as const },
  { label: "Needs support (<45%)", min: 0, tone: "destructive" as const },
];

export default async function InstitutionPlacementsPage() {
  const user = await requireRole("institution");
  if (!user.institutionId) {
    return (
      <EmptyState
        icon="Building2"
        title="Finish your institution profile"
        description="Link your account to an institution to see placement progress."
        action={<Button asChild><Link href="/onboarding/institution/profile">Complete profile</Link></Button>}
      />
    );
  }

  const analytics = await getInstitutionAnalytics(user.institutionId);

  const bands = READINESS_BANDS.map((band, index) => {
    const upper = index === 0 ? 101 : READINESS_BANDS[index - 1].min;
    return {
      label: band.label,
      value: analytics.students.filter((s) => s.readiness >= band.min && s.readiness < upper).length,
      tone: band.tone,
    };
  });

  const placed = analytics.students.filter((s) => s.offers > 0);
  const unplacedReady = analytics.students.filter((s) => s.offers === 0 && s.readiness >= 70);
  const needsSupport = analytics.students.filter((s) => s.readiness < 45);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Placement progress"
        description="Readiness, offers and where intervention would help most."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Placement rate" value={`${analytics.placementRate}%`} icon="Building2" tone="success" />
        <StatCard label="Students placed" value={placed.length} icon="Users" hint={`of ${analytics.totals.students}`} />
        <StatCard label="Ready but unplaced" value={unplacedReady.length} icon="Target" tone="warning" hint="70%+ readiness, no offer yet" />
        <StatCard label="Needs support" value={needsSupport.length} icon="LineChart" tone="destructive" hint="Below 45% readiness" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Placement readiness distribution</CardTitle>
            <CardDescription>How the cohort splits across readiness bands.</CardDescription>
          </CardHeader>
          <CardContent>
            <BarList rows={bands} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Offers by department</CardTitle>
            <CardDescription>Recruitment outcomes per branch.</CardDescription>
          </CardHeader>
          <CardContent>
            <BarList
              rows={analytics.byDepartment.map((d) => ({
                label: d.branch,
                value: d.offers,
                hint: `${d.applications} applications from ${d.students} students`,
                tone: "success",
              }))}
            />
          </CardContent>
        </Card>
      </div>

      {unplacedReady.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ready, but no offer yet</CardTitle>
            <CardDescription>
              These students clear the skill bar. If they are not converting, the constraint is exposure, not capability.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {unplacedReady.map((student) => (
                <li key={student.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{student.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {student.degree} {student.branch} · {student.applications} applications
                    </p>
                  </div>
                  <Badge variant="success">{student.readiness}% ready</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {needsSupport.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Students needing support</CardTitle>
            <CardDescription>Lowest readiness in the cohort, with their current learning progress.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {needsSupport.map((student) => (
              <div key={student.id} className="space-y-1.5">
                <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                  <span className="font-medium">{student.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {student.branch} · {student.domains.length} {student.domains.length === 1 ? "domain" : "domains"}
                    {student.streak > 0 ? ` · ${student.streak}-day streak` : " · no active streak"}
                  </span>
                </div>
                <Progress value={student.readiness} className="h-2" indicatorClassName="bg-destructive" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
