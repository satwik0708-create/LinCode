import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/guard";
import { getStudentProfile } from "@/lib/data/users";
import { getPortfolio } from "@/lib/data/portfolio";
import { listApplicationsForStudent } from "@/lib/data/opportunities";
import { read } from "@/lib/data/store";
import { skillName } from "@/lib/domain/skills";
import { getDomainSnapshots } from "@/lib/services/student";
import { PageHeader } from "@/components/shell/page-header";
import { PortfolioWorkspace } from "./portfolio-workspace";

export const metadata: Metadata = { title: "Digital Portfolio" };

export default async function PortfolioPage() {
  const user = await requireRole("student");
  const [profile, portfolio, applications, snapshots, db] = await Promise.all([
    getStudentProfile(user.id),
    getPortfolio(user.id),
    listApplicationsForStudent(user.id),
    getDomainSnapshots(user.id),
    read(),
  ]);

  // "Internships" in a portfolio means placements actually secured — an
  // application only counts once it reached selection.
  const internships = applications
    .filter((a) => a.stage === "selected")
    .map((a) => {
      const opportunity = db.opportunities.find((o) => o.id === a.opportunityId);
      const organization = opportunity ? db.organizations.find((o) => o.id === opportunity.organizationId) : undefined;
      return {
        id: a.id,
        title: opportunity?.title ?? "Opportunity",
        organizationName: organization?.name ?? "Employer",
        type: opportunity?.type ?? "internship",
        location: opportunity?.location ?? "—",
        durationMonths: opportunity?.durationMonths,
        selectedAt: a.timeline.find((t) => t.stage === "selected")?.at ?? a.updatedAt,
      };
    });

  const skills = Object.values(profile?.skillMatrix ?? {})
    .map((signal) => ({
      id: signal.skillId,
      name: skillName(signal.skillId),
      score: signal.score,
      strength: signal.strength,
      source: signal.source,
      verified: signal.verified,
    }))
    .sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Digital Portfolio"
        description="Your employability profile: verified skills, certifications, projects, internships, achievements and academic records in one place."
      />
      <PortfolioWorkspace
        student={{
          name: user.name,
          headline: profile?.headline,
          about: profile?.about,
          institutionName: profile?.institutionName ?? "",
          degree: profile?.degree ?? "",
          branch: profile?.branch ?? "",
          graduationYear: profile?.graduationYear ?? new Date().getFullYear(),
          cgpa: profile?.cgpa,
          location: profile?.location,
          careerInterests: profile?.careerInterests ?? [],
        }}
        skills={skills}
        certifications={portfolio.certifications}
        projects={portfolio.projects}
        achievements={portfolio.achievements}
        academicRecords={portfolio.academicRecords}
        documents={portfolio.documents.map((d) => ({
          id: d.id, kind: d.kind, filename: d.filename, sizeBytes: d.sizeBytes, uploadedAt: d.uploadedAt,
        }))}
        internships={internships}
        domains={snapshots.map((s) => ({
          id: s.enrollment.domainId,
          name: s.domainName,
          progress: s.enrollment.progress,
          status: s.enrollment.status,
          level: s.enrollment.placedLevel ?? s.enrollment.declaredLevel,
        }))}
      />
    </div>
  );
}
