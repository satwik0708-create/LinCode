import "server-only";
import { listApplicationsForOrganization, listOpportunities, listTrainingPrograms } from "@/lib/data/opportunities";
import { read } from "@/lib/data/store";
import { getStudentProfile } from "@/lib/data/users";
import { skillName } from "@/lib/domain/skills";
import type { ApplicationStage, Opportunity } from "@/lib/types";

export interface PostingRow {
  id: string;
  type: Opportunity["type"];
  title: string;
  location: string;
  workMode: string;
  status: Opportunity["status"];
  openings: number;
  deadline: string;
  createdAt: string;
  requiredSkills: string[];
  mandatorySkills: string[];
  applicantCount: number;
  shortlistedCount: number;
}

export async function getPostings(organizationId: string, types?: Opportunity["type"][]): Promise<PostingRow[]> {
  const [opportunities, applications] = await Promise.all([
    listOpportunities({ organizationId, types, includeClosed: true }),
    listApplicationsForOrganization(organizationId),
  ]);

  return opportunities.map((opportunity) => {
    const mine = applications.filter((a) => a.opportunityId === opportunity.id);
    return {
      id: opportunity.id,
      type: opportunity.type,
      title: opportunity.title,
      location: opportunity.location,
      workMode: opportunity.workMode,
      status: opportunity.status,
      openings: opportunity.openings,
      deadline: opportunity.deadline,
      createdAt: opportunity.createdAt,
      requiredSkills: opportunity.requirements.map((r) => skillName(r.skillId)),
      mandatorySkills: opportunity.requirements.filter((r) => r.mandatory).map((r) => skillName(r.skillId)),
      applicantCount: mine.length,
      shortlistedCount: mine.filter((a) => ["shortlisted", "interview", "selected"].includes(a.stage)).length,
    };
  });
}

export interface ApplicantRow {
  applicationId: string;
  studentName: string;
  studentId: string;
  opportunityId: string;
  opportunityTitle: string;
  stage: ApplicationStage;
  matchScore: number;
  appliedAt: string;
  updatedAt: string;
  institutionName: string;
  degree: string;
  branch: string;
  graduationYear: number;
  cgpa?: number;
  topSkills: Array<{ name: string; score: number }>;
  coverNote?: string;
  resumeDocumentId?: string;
}

/**
 * Applicants for one employer's postings.
 *
 * Scoped by organisation and projected down to what a recruiter legitimately
 * needs — the student's full learning history, streak and other applications
 * are never included.
 */
export async function getApplicants(organizationId: string): Promise<ApplicantRow[]> {
  const [applications, db] = await Promise.all([listApplicationsForOrganization(organizationId), read()]);

  return Promise.all(
    applications.map(async (application) => {
      const student = db.users.find((u) => u.id === application.studentId);
      const profile = await getStudentProfile(application.studentId);
      const opportunity = db.opportunities.find((o) => o.id === application.opportunityId);

      const topSkills = Object.values(profile?.skillMatrix ?? {})
        .sort((a, b) => b.score - a.score)
        .slice(0, 6)
        .map((signal) => ({ name: skillName(signal.skillId), score: signal.score }));

      return {
        applicationId: application.id,
        studentName: student?.name ?? "Candidate",
        studentId: application.studentId,
        opportunityId: application.opportunityId,
        opportunityTitle: opportunity?.title ?? "Posting",
        stage: application.stage,
        matchScore: application.matchScore,
        appliedAt: application.createdAt,
        updatedAt: application.updatedAt,
        institutionName: profile?.institutionName ?? "—",
        degree: profile?.degree ?? "—",
        branch: profile?.branch ?? "—",
        graduationYear: profile?.graduationYear ?? 0,
        cgpa: profile?.cgpa,
        topSkills,
        coverNote: application.coverNote,
        resumeDocumentId: application.resumeDocumentId,
      };
    }),
  );
}

export async function getTrainingRows(organizationId: string) {
  const [programs, db] = await Promise.all([listTrainingPrograms({ organizationId }), read()]);
  return programs.map((program) => ({
    ...program,
    skillNames: program.skillIds.map(skillName),
    enrolledCount: db.enrollments.filter((e) => e.programId === program.id).length,
  }));
}
