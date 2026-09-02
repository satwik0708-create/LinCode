import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/guard";
import { getPostings } from "@/lib/services/recruiter";
import { LEARNING_DOMAINS } from "@/lib/domain/domains";
import { SKILLS } from "@/lib/domain/skills";
import { PageHeader } from "@/components/shell/page-header";
import { PostingList } from "@/components/industry/posting-list";
import { PostOpportunityDialog } from "@/components/industry/post-opportunity-dialog";
import { EmptyState } from "@/components/shell/empty-state";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Jobs" };

export default async function IndustryJobsPage() {
  const user = await requireRole("industry");
  if (!user.organizationId) {
    return (
      <EmptyState
        icon="Building2"
        title="Finish your organisation profile"
        description="Add your organisation before posting roles."
        action={<Button asChild><Link href="/onboarding/industry/profile">Complete profile</Link></Button>}
      />
    );
  }

  const postings = await getPostings(user.organizationId, ["job"]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Jobs"
        description="Entry-level and graduate roles, matched to candidates on demonstrated skills rather than keywords."
        actions={
          <PostOpportunityDialog
            type="job"
            triggerLabel="Post a job"
            domains={LEARNING_DOMAINS.map((d) => ({ id: d.id, name: d.name }))}
            skills={SKILLS.map((s) => ({ id: s.id, name: s.name, domainIds: s.domainIds }))}
          />
        }
      />
      <PostingList
        postings={postings}
        emptyTitle="No postings yet"
        emptyDescription="Publish a role to start receiving skill-scored applications."
      />
    </div>
  );
}
