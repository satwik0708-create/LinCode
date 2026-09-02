import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/guard";
import { getProgramRows } from "@/lib/services/programs";
import { PageHeader } from "@/components/shell/page-header";
import { ProgramBoard } from "@/components/programs/program-board";

export const metadata: Metadata = { title: "Research & Consultancy" };

export default async function FacultyResearchPage() {
  const user = await requireRole("faculty");
  const programs = await getProgramRows(user.id, "faculty", ["research", "consultancy"]);

  return (
    <div className="space-y-6">
      <PageHeader title="Research & Consultancy" description="Funded collaborative research and paid consultancy engagements from industry partners." />
      <ProgramBoard
        programs={programs}
        emptyTitle="Nothing open right now"
        emptyDescription="No research or consultancy opportunities are open at the moment."
      />
    </div>
  );
}
