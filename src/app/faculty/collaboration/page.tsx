import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/guard";
import { getProgramRows } from "@/lib/services/programs";
import { PageHeader } from "@/components/shell/page-header";
import { ProgramBoard } from "@/components/programs/program-board";
import { StatCard } from "@/components/shell/stat-card";

export const metadata: Metadata = { title: "Industry–Academia Collaboration" };

export default async function FacultyCollaborationPage() {
  const user = await requireRole("faculty");
  const programs = await getProgramRows(user.id, "faculty");

  const mentorship = programs.filter((p) => p.kind === "mentorship").length;
  const workshops = programs.filter((p) => p.kind === "workshop" || p.kind === "guest_lecture").length;
  const challenges = programs.filter((p) => p.kind === "innovation_challenge" || p.kind === "live_project").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Industry–Academia Collaboration"
        description="Every programme open to your role, in one place: mentorship, workshops, guest lectures, innovation challenges, live projects, internships, FDPs, research and consultancy."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="All open programmes" value={programs.length} icon="Handshake" />
        <StatCard label="Mentorship" value={mentorship} icon="Users" />
        <StatCard label="Workshops & lectures" value={workshops} icon="GraduationCap" />
        <StatCard label="Challenges & live projects" value={challenges} icon="Boxes" />
      </div>

      <ProgramBoard
        programs={programs}
        emptyTitle="No open programmes"
        emptyDescription="Industry partners post throughout the academic year — check back shortly."
      />
    </div>
  );
}
