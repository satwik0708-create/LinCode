import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/guard";
import { listApplicationsForStudent } from "@/lib/data/opportunities";
import { read } from "@/lib/data/store";
import { PageHeader } from "@/components/shell/page-header";
import { StatCard } from "@/components/shell/stat-card";
import { EmptyState } from "@/components/shell/empty-state";
import { Button } from "@/components/ui/button";
import { ApplicationTracker } from "./application-tracker";

export const metadata: Metadata = { title: "Applications" };

export default async function ApplicationsPage() {
  const user = await requireRole("student");
  const applications = await listApplicationsForStudent(user.id);
  const db = await read();

  const rows = applications.map((application) => {
    const opportunity = db.opportunities.find((o) => o.id === application.opportunityId);
    const organization = opportunity ? db.organizations.find((o) => o.id === opportunity.organizationId) : undefined;
    return {
      id: application.id,
      title: opportunity?.title ?? "Opportunity",
      type: opportunity?.type ?? "internship",
      organizationName: organization?.name ?? "Employer",
      location: opportunity?.location ?? "—",
      stage: application.stage,
      matchScore: application.matchScore,
      createdAt: application.createdAt,
      updatedAt: application.updatedAt,
      timeline: application.timeline,
      coverNote: application.coverNote,
    };
  });

  const active = rows.filter((r) => !["rejected", "withdrawn"].includes(r.stage));
  const interviews = rows.filter((r) => r.stage === "interview" || r.stage === "shortlisted");
  const selected = rows.filter((r) => r.stage === "selected");

  return (
    <div className="space-y-8">
      <PageHeader
        title="Application tracker"
        description="Every application in one place, with the full history of how it moved. You should never have to remember where you applied."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total applications" value={rows.length} icon="ListChecks" />
        <StatCard label="Active" value={active.length} icon="Briefcase" hint="Not rejected or withdrawn" />
        <StatCard label="Shortlisted / interviewing" value={interviews.length} icon="Users" tone="warning" />
        <StatCard label="Offers" value={selected.length} icon="Building2" tone="success" />
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon="ListChecks"
          title="No applications yet"
          description="When you apply to an internship or job, it appears here with its full status history."
          action={<Button asChild><Link href="/student/internships">Browse internships</Link></Button>}
        />
      ) : (
        <ApplicationTracker rows={rows} />
      )}
    </div>
  );
}
