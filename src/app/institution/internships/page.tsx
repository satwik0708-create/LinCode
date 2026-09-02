import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/guard";
import { getInstitutionAnalytics } from "@/lib/services/institution";
import { listApplicationsForInstitution } from "@/lib/data/opportunities";
import { read } from "@/lib/data/store";
import { PageHeader } from "@/components/shell/page-header";
import { StatCard } from "@/components/shell/stat-card";
import { BarList } from "@/components/shell/bar-list";
import { EmptyState } from "@/components/shell/empty-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Internships" };

export default async function InstitutionInternshipsPage() {
  const user = await requireRole("institution");
  if (!user.institutionId) {
    return (
      <EmptyState
        icon="Building2"
        title="Finish your institution profile"
        description="Link your account to an institution to see internship participation."
        action={<Button asChild><Link href="/onboarding/institution/profile">Complete profile</Link></Button>}
      />
    );
  }

  const [analytics, applications, db] = await Promise.all([
    getInstitutionAnalytics(user.institutionId),
    listApplicationsForInstitution(user.institutionId),
    read(),
  ]);

  const internshipApps = applications.filter((application) => {
    const opportunity = db.opportunities.find((o) => o.id === application.opportunityId);
    return opportunity && ["internship", "project", "apprenticeship"].includes(opportunity.type);
  });

  const rows = internshipApps
    .map((application) => {
      const opportunity = db.opportunities.find((o) => o.id === application.opportunityId);
      const organization = opportunity ? db.organizations.find((o) => o.id === opportunity.organizationId) : undefined;
      const student = db.users.find((u) => u.id === application.studentId);
      return {
        id: application.id,
        studentName: student?.name ?? "Student",
        title: opportunity?.title ?? "Internship",
        organizationName: organization?.name ?? "Employer",
        stage: application.stage,
        matchScore: application.matchScore,
        updatedAt: application.updatedAt,
      };
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const participating = new Set(internshipApps.map((a) => a.studentId)).size;
  const secured = internshipApps.filter((a) => a.stage === "selected").length;

  const byEmployer = new Map<string, number>();
  for (const row of rows) byEmployer.set(row.organizationName, (byEmployer.get(row.organizationName) ?? 0) + 1);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Internship participation"
        description="Which students are applying, where they are applying, and how far they get."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Students participating" value={participating} icon="Users" hint={`of ${analytics.totals.students}`} />
        <StatCard label="Applications" value={internshipApps.length} icon="Briefcase" />
        <StatCard label="In interviews" value={internshipApps.filter((a) => ["shortlisted", "interview"].includes(a.stage)).length} icon="ListChecks" tone="warning" />
        <StatCard label="Internships secured" value={secured} icon="Building2" tone="success" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Where students are applying</CardTitle>
            <CardDescription>Applications by employer.</CardDescription>
          </CardHeader>
          <CardContent>
            {byEmployer.size === 0 ? (
              <p className="text-sm text-muted-foreground">No applications yet.</p>
            ) : (
              <BarList
                rows={[...byEmployer.entries()]
                  .sort((a, b) => b[1] - a[1])
                  .map(([label, value]) => ({ label, value }))}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Participation by department</CardTitle>
            <CardDescription>Total applications per branch.</CardDescription>
          </CardHeader>
          <CardContent>
            <BarList rows={analytics.byDepartment.map((d) => ({ label: d.branch, value: d.applications, hint: `${d.students} students` }))} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent internship applications</CardTitle>
          <CardDescription>Latest activity across your cohort.</CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No internship applications recorded yet.</p>
          ) : (
            <ul className="divide-y">
              {rows.slice(0, 15).map((row) => (
                <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{row.studentName}</p>
                    <p className="truncate text-xs text-muted-foreground">{row.title} · {row.organizationName}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-xs tabular-nums text-muted-foreground">{row.matchScore}% match</span>
                    <Badge
                      variant={row.stage === "selected" ? "success" : row.stage === "rejected" ? "destructive" : "muted"}
                      className="capitalize"
                    >
                      {row.stage.replace("_", " ")}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{formatDate(row.updatedAt)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
