import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/guard";
import { getProgramRows } from "@/lib/services/programs";
import { PageHeader } from "@/components/shell/page-header";
import { ProgramBoard } from "@/components/programs/program-board";

export const metadata: Metadata = { title: "Industrial Training" };

export default async function FacultyTrainingPage() {
  const user = await requireRole("faculty");
  const programs = await getProgramRows(user.id, "faculty", ["industrial_training"]);

  return (
    <div className="space-y-6">
      <PageHeader title="Industrial Training" description="Short intensives on the toolchains industry runs in production, open to faculty and senior students." />
      <ProgramBoard
        programs={programs}
        emptyTitle="Nothing open right now"
        emptyDescription="No training programmes are currently open."
      />
    </div>
  );
}
