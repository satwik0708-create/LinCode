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

export const metadata: Metadata = { title: "Internships" };

export default async function IndustryInternshipsPage() {
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

  const postings = await getPostings(user.organizationId, ["internship"]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Internships"
        description="Internship postings with the exact skills you need. Students see a per-skill match against their assessed profile."
        actions={
          <PostOpportunityDialog
            type="internship"
            triggerLabel="Post an internship"
            domains={LEARNING_DOMAINS.map((d) => ({ id: d.id, name: d.name }))}
            skills={SKILLS.map((s) => ({ id: s.id, name: s.name, domainIds: s.domainIds }))}
          />
        }
      />
      <PostingList
        postings={postings}
        emptyTitle="No postings yet"
        emptyDescription="Publish your first internship and it will start matching against student skill profiles immediately."
      />
    </div>
  );
}
