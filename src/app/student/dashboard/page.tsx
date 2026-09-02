import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Plus } from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import { getStudentOverview } from "@/lib/services/student";
import { getOrganization } from "@/lib/data/users";
import { getDomain } from "@/lib/domain/domains";
import { PageHeader } from "@/components/shell/page-header";
import { StatCard } from "@/components/shell/stat-card";
import { EmptyState } from "@/components/shell/empty-state";
import { DomainProgressCard } from "@/components/student/domain-progress-card";
import { StreakWidget } from "@/components/student/streak-widget";
import { OpportunityCard } from "@/components/student/opportunity-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

const STAGE_LABEL: Record<string, string> = {
  applied: "Applied", under_review: "Under review", shortlisted: "Shortlisted",
  interview: "Interview", selected: "Selected", rejected: "Not selected", withdrawn: "Withdrawn",
};

export default async function StudentDashboard() {
  const user = await requireRole("student");
  const overview = await getStudentOverview(user.id);
  if (!overview) redirect("/onboarding/student/profile");

  const { profile, domains, streak, applications, topMatches, primaryGap, portfolioCounts, readiness } = overview;

  const organizations = new Map(
    await Promise.all(
      topMatches.map(async (m) => [m.opportunity.organizationId, (await getOrganization(m.opportunity.organizationId))?.name ?? "Employer"] as const),
    ),
  );

  const activeApplications = applications.filter((a) => !["rejected", "withdrawn"].includes(a.stage));

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome back, ${user.name.split(" ")[0]}`}
        description={
          primaryGap
            ? primaryGap.summary
            : "Add a learning domain to get your first skill-gap analysis."
        }
        actions={
          <Button asChild>
            <Link href="/student/learning">
              <Plus className="size-4" />
              Add a domain
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Placement readiness" value={`${readiness}%`} icon="Target" hint="Against your primary domain" tone={readiness >= 70 ? "success" : readiness >= 40 ? "warning" : "destructive"} />
        <StatCard label="Domains in progress" value={domains.filter((d) => d.enrollment.status === "in_progress").length} icon="BookOpen" hint={`${domains.filter((d) => d.enrollment.status === "completed").length} completed`} />
        <StatCard label="Active applications" value={activeApplications.length} icon="ListChecks" hint={`${applications.length} total`} />
        <StatCard label="Portfolio items" value={portfolioCounts.certifications + portfolioCounts.projects + portfolioCounts.achievements} icon="FolderOpen" hint={`${portfolioCounts.verified} verified`} tone="success" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold tracking-tight">My learning</h2>
              <Button asChild variant="ghost" size="sm">
                <Link href="/student/learning">View all<ArrowRight className="size-3.5" /></Link>
              </Button>
            </div>
            {domains.length === 0 ? (
              <EmptyState
                icon="BookOpen"
                title="No domains yet"
                description="Pick a learning domain to get an assessment, a gap analysis and a path built around what you already know."
                action={<Button asChild><Link href="/student/learning">Browse domains</Link></Button>}
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {domains.slice(0, 4).map((snapshot) => (
                  <DomainProgressCard key={snapshot.enrollment.domainId} snapshot={snapshot} />
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold tracking-tight">Recommended for your skill profile</h2>
              <Button asChild variant="ghost" size="sm">
                <Link href="/student/internships">See all<ArrowRight className="size-3.5" /></Link>
              </Button>
            </div>
            {topMatches.length === 0 ? (
              <EmptyState icon="Briefcase" title="No matches yet" description="Complete a diagnostic so we can score opportunities against your actual skills." />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {topMatches.slice(0, 2).map((entry) => (
                  <OpportunityCard
                    key={entry.opportunity.id}
                    entry={entry}
                    organizationName={organizations.get(entry.opportunity.organizationId) ?? "Employer"}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="mb-3 text-lg font-semibold tracking-tight">Learning streak</h2>
            <StreakWidget streak={streak} />
          </div>

          {primaryGap && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Close these next</CardTitle>
                <CardDescription>
                  Your biggest gaps in {getDomain(primaryGap.domainId)?.name ?? primaryGap.domainId}.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[...primaryGap.needsImprovement, ...primaryGap.missing].slice(0, 4).map((entry) => (
                  <div key={entry.skillId} className="space-y-1">
                    <div className="flex items-baseline justify-between gap-2 text-sm">
                      <span className="truncate font-medium">{entry.skillName}</span>
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {entry.currentScore}% / {entry.requiredScore}%
                      </span>
                    </div>
                    <Progress value={entry.currentScore} className="h-1.5" indicatorClassName="bg-destructive" />
                  </div>
                ))}
                {primaryGap.needsImprovement.length === 0 && primaryGap.missing.length === 0 && (
                  <p className="text-sm text-muted-foreground">No significant gaps left in this domain.</p>
                )}
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href="/student/skill-gap">Full gap analysis<ArrowRight className="size-3.5" /></Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Application activity</CardTitle>
              <CardDescription>Latest movement across your applications.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {applications.length === 0 && (
                <p className="text-sm text-muted-foreground">You have not applied to anything yet.</p>
              )}
              {applications.slice(0, 4).map((application) => (
                <div key={application.id} className="flex items-start justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{application.opportunityId.replace(/^opp_/, "").replace(/_/g, " ")}</p>
                    <p className="text-xs text-muted-foreground">Updated {formatDate(application.updatedAt)}</p>
                  </div>
                  <Badge
                    variant={
                      application.stage === "selected" ? "success"
                        : application.stage === "rejected" ? "destructive"
                          : application.stage === "interview" || application.stage === "shortlisted" ? "warning"
                            : "muted"
                    }
                  >
                    {STAGE_LABEL[application.stage] ?? application.stage}
                  </Badge>
                </div>
              ))}
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href="/student/applications">Application tracker<ArrowRight className="size-3.5" /></Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-primary/[0.04]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Ask the career advisor</CardTitle>
              <CardDescription>
                &ldquo;Am I ready for a frontend internship?&rdquo; · &ldquo;What should I learn next?&rdquo;
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/student/career-advisor">Open advisor<ArrowRight className="size-3.5" /></Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {profile.degree} {profile.branch} · {profile.institutionName} · Graduating {profile.graduationYear}
      </p>
    </div>
  );
}
