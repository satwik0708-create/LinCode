import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/guard";
import { getBoardEntries } from "@/lib/services/opportunity-view";
import { PageHeader } from "@/components/shell/page-header";
import { OpportunityBoard } from "@/components/student/opportunity-board";

export const metadata: Metadata = { title: "Jobs" };

export default async function JobsPage() {
  const user = await requireRole("student");
  const { entries, organizations } = await getBoardEntries(user.id, ["job"]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Entry-level jobs"
        description="Graduate and entry-level roles ranked by how closely your demonstrated skills match what each employer asked for."
      />
      <OpportunityBoard
        entries={entries}
        organizations={organizations}
        emptyTitle="No jobs match that search"
        emptyDescription="Adjust your filters, or check back — employers post throughout the recruitment season."
      />
    </div>
  );
}
