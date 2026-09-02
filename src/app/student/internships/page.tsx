import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/guard";
import { getBoardEntries } from "@/lib/services/opportunity-view";
import { PageHeader } from "@/components/shell/page-header";
import { OpportunityBoard } from "@/components/student/opportunity-board";

export const metadata: Metadata = { title: "Internships" };

export default async function InternshipsPage() {
  const user = await requireRole("student");
  const { entries, organizations } = await getBoardEntries(user.id, ["internship", "project", "apprenticeship"]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Internships, projects & apprenticeships"
        description="Every posting is scored against your skill matrix, requirement by requirement. Eligibility is checked on the server when you apply, not just displayed here."
      />
      <OpportunityBoard
        entries={entries}
        organizations={organizations}
        emptyTitle="No internships match that search"
        emptyDescription="Try clearing the filters, or broaden your learning domains to widen the pool."
      />
    </div>
  );
}
