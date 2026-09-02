import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/guard";
import { getProgramRows } from "@/lib/services/programs";
import { PageHeader } from "@/components/shell/page-header";
import { ProgramBoard } from "@/components/programs/program-board";

export const metadata: Metadata = { title: "Faculty Development Programmes" };

export default async function FacultyFdpPage() {
  const user = await requireRole("faculty");
  const programs = await getProgramRows(user.id, "faculty", ["fdp"]);

  return (
    <div className="space-y-6">
      <PageHeader title="Faculty Development Programmes" description="Industry-run FDPs covering curriculum design, assessment and the tooling your students will actually meet at work." />
      <ProgramBoard
        programs={programs}
        emptyTitle="Nothing open right now"
        emptyDescription="No FDPs are currently accepting applications."
      />
    </div>
  );
}
