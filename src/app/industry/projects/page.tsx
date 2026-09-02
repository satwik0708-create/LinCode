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

export const metadata: Metadata = { title: "Projects & Apprenticeships" };

export default async function IndustryProjectsPage() {
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

  const postings = await getPostings(user.organizationId, ["project", "apprenticeship"]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects & Apprenticeships"
        description="Live projects and apprenticeships — shorter engagements that let you evaluate candidates on real work."
        actions={
          <PostOpportunityDialog
            type="project"
            triggerLabel="Post a project"
            domains={LEARNING_DOMAINS.map((d) => ({ id: d.id, name: d.name }))}
            skills={SKILLS.map((s) => ({ id: s.id, name: s.name, domainIds: s.domainIds }))}
          />
        }
      />
      <PostingList
        postings={postings}
        emptyTitle="No postings yet"
        emptyDescription="Publish a live project or apprenticeship to get started."
      />
    </div>
  );
}
