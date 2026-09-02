import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import { getIndustryProfile } from "@/lib/data/users";
import { getApplicants, getPostings, getTrainingRows } from "@/lib/services/recruiter";
import { PageHeader } from "@/components/shell/page-header";
import { StatCard } from "@/components/shell/stat-card";
import { EmptyState } from "@/components/shell/empty-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatDate, relativeDays } from "@/lib/utils";

export const metadata: Metadata = { title: "Recruiter Dashboard" };

export default async function IndustryDashboard() {
  const user = await requireRole("industry");
  if (!user.organizationId) {
    return (
      <EmptyState
        icon="Building2"
        title="Finish your organisation profile"
        description="Add your organisation before posting roles or reviewing applicants."
        action={<Button asChild><Link href="/onboarding/industry/profile">Complete profile</Link></Button>}
      />
    );
  }

  const [profile, postings, applicants, training] = await Promise.all([
    getIndustryProfile(user.id),
    getPostings(user.organizationId),
    getApplicants(user.organizationId),
    getTrainingRows(user.organizationId),
  ]);

  const open = postings.filter((p) => p.status === "open");
  const newApplicants = applicants.filter((a) => a.stage === "applied");
  const inPipeline = applicants.filter((a) => ["under_review", "shortlisted", "interview"].includes(a.stage));
  const hired = applicants.filter((a) => a.stage === "selected");

  const pipelineStages = [
    { label: "Applied", count: applicants.filter((a) => a.stage === "applied").length },
    { label: "Under review", count: applicants.filter((a) => a.stage === "under_review").length },
    { label: "Shortlisted", count: applicants.filter((a) => a.stage === "shortlisted").length },
    { label: "Interview", count: applicants.filter((a) => a.stage === "interview").length },
    { label: "Selected", count: hired.length },
  ];
  const maxStage = Math.max(1, ...pipelineStages.map((s) => s.count));

  return (
    <div className="space-y-8">
      <PageHeader
        title={profile?.companyName ?? "Recruiter dashboard"}
        description={
          profile
            ? `${profile.designation} · ${profile.industrySector} · ${profile.companySize} employees`
            : "Post roles, run training programmes and manage your recruitment pipeline."
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Open postings" value={open.length} icon="Briefcase" hint={`${postings.length} total`} />
        <StatCard label="New applicants" value={newApplicants.length} icon="Users" tone={newApplicants.length ? "warning" : "default"} hint="Awaiting first review" />
        <StatCard label="In pipeline" value={inPipeline.length} icon="ListChecks" />
        <StatCard label="Selected" value={hired.length} icon="Building2" tone="success" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Recruitment pipeline</CardTitle>
            <CardDescription>Where every applicant across your postings currently sits.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pipelineStages.map((stage) => (
              <div key={stage.label} className="space-y-1">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-medium">{stage.label}</span>
                  <span className="tabular-nums text-muted-foreground">{stage.count}</span>
                </div>
                <Progress value={(stage.count / maxStage) * 100} className="h-2" />
              </div>
            ))}
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/industry/applicants">Review applicants<ArrowRight className="size-3.5" /></Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Closing soon</CardTitle>
            <CardDescription>Postings approaching their deadline.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {open.length === 0 && <p className="text-sm text-muted-foreground">No open postings.</p>}
            {[...open]
              .sort((a, b) => a.deadline.localeCompare(b.deadline))
              .slice(0, 5)
              .map((posting) => (
                <div key={posting.id} className="flex items-start justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{posting.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {posting.applicantCount} applicants · closes {relativeDays(posting.deadline)}
                    </p>
                  </div>
                  <Badge variant="muted" className="shrink-0 capitalize">{posting.type}</Badge>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <h2 className="text-lg font-semibold tracking-tight">Recent applicants</h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/industry/applicants">See all<ArrowRight className="size-3.5" /></Link>
          </Button>
        </div>
        {applicants.length === 0 ? (
          <EmptyState icon="Users" title="No applicants yet" description="Applications to your postings appear here with a skill-compatibility score." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {applicants.slice(0, 6).map((applicant) => (
              <Card key={applicant.applicationId}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{applicant.studentName}</p>
                      <p className="truncate text-xs text-muted-foreground">{applicant.opportunityTitle}</p>
                    </div>
                    <span className="shrink-0 text-lg font-semibold tabular-nums">{applicant.matchScore}%</span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {applicant.degree} {applicant.branch} · {applicant.institutionName}
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <Badge variant="secondary" className="capitalize">{applicant.stage.replace("_", " ")}</Badge>
                    <span className="text-[11px] text-muted-foreground">{formatDate(applicant.appliedAt)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {training.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold tracking-tight">Your training programmes</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {training.map((program) => (
              <Card key={program.id}>
                <CardContent className="p-4">
                  <Badge variant="muted" className="capitalize">{program.kind}</Badge>
                  <p className="mt-2 font-medium">{program.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {program.enrolledCount} enrolled of {program.seats} seats · {program.durationWeeks} weeks
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
