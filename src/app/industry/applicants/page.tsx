import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/guard";
import { getApplicants, getPostings } from "@/lib/services/recruiter";
import { PageHeader } from "@/components/shell/page-header";
import { StatCard } from "@/components/shell/stat-card";
import { EmptyState } from "@/components/shell/empty-state";
import { Button } from "@/components/ui/button";
import { ApplicantPipeline } from "./applicant-pipeline";

export const metadata: Metadata = { title: "Applicants" };

export default async function ApplicantsPage() {
  const user = await requireRole("industry");
  if (!user.organizationId) {
    return (
      <EmptyState
        icon="Building2"
        title="Finish your organisation profile"
        description="Add your organisation to see applicants."
        action={<Button asChild><Link href="/onboarding/industry/profile">Complete profile</Link></Button>}
      />
    );
  }

  // Both queries are scoped by organisation, so this page can only ever show
  // this employer's own postings and their applicants.
  const [applicants, postings] = await Promise.all([
    getApplicants(user.organizationId),
    getPostings(user.organizationId),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Applicants"
        description="Candidates who applied to your postings, with the skill compatibility computed at the time they applied. You see only what a recruiter needs — not their wider learning history."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total applicants" value={applicants.length} icon="Users" />
        <StatCard label="Awaiting review" value={applicants.filter((a) => a.stage === "applied").length} icon="ListChecks" tone="warning" />
        <StatCard label="Strong matches" value={applicants.filter((a) => a.matchScore >= 75).length} icon="Target" tone="success" hint="75%+ skill match" />
        <StatCard label="Selected" value={applicants.filter((a) => a.stage === "selected").length} icon="Building2" tone="success" />
      </div>

      {applicants.length === 0 ? (
        <EmptyState
          icon="Users"
          title="No applicants yet"
          description="Once students apply to your postings they appear here, ranked by skill compatibility."
        />
      ) : (
        <ApplicantPipeline
          applicants={applicants}
          postings={postings.map((p) => ({ id: p.id, title: p.title }))}
        />
      )}
    </div>
  );
}
