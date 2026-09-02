import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/guard";
import { getProgramRows } from "@/lib/services/programs";
import { PageHeader } from "@/components/shell/page-header";
import { ProgramBoard } from "@/components/programs/program-board";

export const metadata: Metadata = { title: "Faculty Internships" };

export default async function FacultyInternshipsPage() {
  const user = await requireRole("faculty");
  const programs = await getProgramRows(user.id, "faculty", ["faculty_internship"]);

  return (
    <div className="space-y-6">
      <PageHeader title="Faculty Internships" description="Spend time embedded with an industry team and bring production experience back to your department." />
      <ProgramBoard
        programs={programs}
        emptyTitle="Nothing open right now"
        emptyDescription="Industry partners post faculty internships seasonally — check back before the next term."
      />
    </div>
  );
}
