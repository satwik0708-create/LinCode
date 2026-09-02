import "server-only";
import { read } from "@/lib/data/store";
import { listApplicationsForInstitution } from "@/lib/data/opportunities";
import { getSkillEngine } from "@/lib/ai";
import { buildEngineContext } from "./student";
import { LEARNING_DOMAINS, getDomain } from "@/lib/domain/domains";
import { skillName } from "@/lib/domain/skills";
import type { ApplicationStage } from "@/lib/types";

/**
 * Institutional analytics.
 *
 * Every query here is scoped by institutionId, taken from the authenticated
 * user's own record. An institution can only ever see its own cohort — there is
 * no code path that widens the scope, and no request parameter that could.
 */

export interface StudentRow {
  id: string;
  name: string;
  degree: string;
  branch: string;
  graduationYear: number;
  cgpa?: number;
  domains: Array<{ id: string; name: string; progress: number; status: string; level: string }>;
  readiness: number;
  applications: number;
  offers: number;
  verifiedCredentials: number;
  streak: number;
  averageSkillScore: number;
}

export interface InstitutionAnalytics {
  institutionName: string;
  students: StudentRow[];
  totals: {
    students: number;
    enrolled: number;
    assessed: number;
    applied: number;
    interviewing: number;
    placed: number;
  };
  averageReadiness: number;
  placementRate: number;
  byDepartment: Array<{
    branch: string;
    students: number;
    averageReadiness: number;
    applications: number;
    offers: number;
  }>;
  domainAdoption: Array<{ id: string; name: string; enrolled: number; completed: number; averageProgress: number }>;
  topGaps: Array<{ skillId: string; skillName: string; affected: number; averageScore: number }>;
  industryDemand: Array<{ skillId: string; skillName: string; postings: number }>;
  applicationFunnel: Array<{ stage: ApplicationStage; label: string; count: number }>;
  recentActivity: Array<{ studentName: string; title: string; stage: string; at: string }>;
}

const STAGE_LABEL: Record<ApplicationStage, string> = {
  applied: "Applied", under_review: "Under review", shortlisted: "Shortlisted",
  interview: "Interview", selected: "Selected", rejected: "Not selected", withdrawn: "Withdrawn",
};

export async function getInstitutionAnalytics(institutionId: string): Promise<InstitutionAnalytics> {
  const db = await read();
  const institution = db.institutions.find((i) => i.id === institutionId);

  const students = db.users.filter((u) => u.institutionId === institutionId && u.roles.includes("student"));
  const studentIds = new Set(students.map((s) => s.id));
  const applications = await listApplicationsForInstitution(institutionId);

  const rows: StudentRow[] = await Promise.all(
    students.map(async (student) => {
      const profile = db.studentProfiles.find((p) => p.userId === student.id);
      const ctx = await buildEngineContext(student.id);

      const primaryDomain =
        profile?.enrollments.find((e) => e.status === "in_progress")?.domainId ?? profile?.enrollments[0]?.domainId;
      const readiness =
        ctx && primaryDomain ? getSkillEngine().analyseSkillGap(primaryDomain, ctx).readinessScore : 0;

      const mine = applications.filter((a) => a.studentId === student.id);
      const scores = Object.values(profile?.skillMatrix ?? {}).map((s) => s.score);
      const streak = db.streaks.find((s) => s.userId === student.id)?.current ?? 0;

      const verified =
        db.certifications.filter((c) => c.userId === student.id && c.verified).length +
        db.projects.filter((p) => p.userId === student.id && p.verified).length +
        db.achievements.filter((a) => a.userId === student.id && a.verified).length;

      return {
        id: student.id,
        name: student.name,
        degree: profile?.degree ?? "—",
        branch: profile?.branch ?? "Unassigned",
        graduationYear: profile?.graduationYear ?? 0,
        cgpa: profile?.cgpa,
        domains: (profile?.enrollments ?? []).map((e) => ({
          id: e.domainId,
          name: getDomain(e.domainId)?.name ?? e.domainId,
          progress: e.progress,
          status: e.status,
          level: e.placedLevel ?? e.declaredLevel,
        })),
        readiness,
        applications: mine.length,
        offers: mine.filter((a) => a.stage === "selected").length,
        verifiedCredentials: verified,
        streak,
        averageSkillScore: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
      };
    }),
  );

  // --- Department rollup ------------------------------------------------
  const branchMap = new Map<string, StudentRow[]>();
  for (const row of rows) {
    const list = branchMap.get(row.branch) ?? [];
    list.push(row);
    branchMap.set(row.branch, list);
  }
  const byDepartment = [...branchMap.entries()]
    .map(([branch, list]) => ({
      branch,
      students: list.length,
      averageReadiness: Math.round(list.reduce((sum, r) => sum + r.readiness, 0) / list.length),
      applications: list.reduce((sum, r) => sum + r.applications, 0),
      offers: list.reduce((sum, r) => sum + r.offers, 0),
    }))
    .sort((a, b) => b.students - a.students);

  // --- Domain adoption --------------------------------------------------
  const domainAdoption = LEARNING_DOMAINS.map((domain) => {
    const enrolments = rows.flatMap((r) => r.domains.filter((d) => d.id === domain.id));
    return {
      id: domain.id,
      name: domain.name,
      enrolled: enrolments.length,
      completed: enrolments.filter((e) => e.status === "completed").length,
      averageProgress: enrolments.length
        ? Math.round(enrolments.reduce((sum, e) => sum + e.progress, 0) / enrolments.length)
        : 0,
    };
  }).sort((a, b) => b.enrolled - a.enrolled);

  // --- Cohort skill gaps -------------------------------------------------
  const skillTotals = new Map<string, { sum: number; count: number; below: number }>();
  for (const student of students) {
    const profile = db.studentProfiles.find((p) => p.userId === student.id);
    for (const signal of Object.values(profile?.skillMatrix ?? {})) {
      const bucket = skillTotals.get(signal.skillId) ?? { sum: 0, count: 0, below: 0 };
      bucket.sum += signal.score;
      bucket.count += 1;
      if (signal.score < 60) bucket.below += 1;
      skillTotals.set(signal.skillId, bucket);
    }
  }
  const topGaps = [...skillTotals.entries()]
    .map(([skillId, bucket]) => ({
      skillId,
      skillName: skillName(skillId),
      affected: bucket.below,
      averageScore: Math.round(bucket.sum / bucket.count),
    }))
    .filter((g) => g.affected > 0)
    .sort((a, b) => b.affected - a.affected || a.averageScore - b.averageScore)
    .slice(0, 8);

  // --- Industry demand ---------------------------------------------------
  const demand = new Map<string, number>();
  for (const opportunity of db.opportunities.filter((o) => o.status === "open")) {
    for (const requirement of opportunity.requirements) {
      demand.set(requirement.skillId, (demand.get(requirement.skillId) ?? 0) + 1);
    }
  }
  const industryDemand = [...demand.entries()]
    .map(([skillId, postings]) => ({ skillId, skillName: skillName(skillId), postings }))
    .sort((a, b) => b.postings - a.postings)
    .slice(0, 8);

  // --- Funnel & activity -------------------------------------------------
  const funnelStages: ApplicationStage[] = ["applied", "under_review", "shortlisted", "interview", "selected"];
  const applicationFunnel = funnelStages.map((stage) => ({
    stage,
    label: STAGE_LABEL[stage],
    // Cumulative: reaching "interview" means the application also passed the
    // earlier stages, so each bar counts everyone at or beyond it.
    count: applications.filter((a) => funnelStages.indexOf(a.stage) >= funnelStages.indexOf(stage)).length,
  }));

  const nameById = new Map(students.map((s) => [s.id, s.name]));
  const recentActivity = [...applications]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 8)
    .map((application) => ({
      studentName: nameById.get(application.studentId) ?? "Student",
      title: db.opportunities.find((o) => o.id === application.opportunityId)?.title ?? "Opportunity",
      stage: STAGE_LABEL[application.stage],
      at: application.updatedAt,
    }));

  const placed = rows.filter((r) => r.offers > 0).length;
  const appliedStudents = new Set(applications.filter((a) => studentIds.has(a.studentId)).map((a) => a.studentId));

  return {
    institutionName: institution?.name ?? "Your institution",
    students: rows.sort((a, b) => b.readiness - a.readiness),
    totals: {
      students: rows.length,
      enrolled: rows.filter((r) => r.domains.length > 0).length,
      assessed: rows.filter((r) => r.averageSkillScore > 0).length,
      applied: appliedStudents.size,
      interviewing: applications.filter((a) => ["shortlisted", "interview"].includes(a.stage)).length,
      placed,
    },
    averageReadiness: rows.length ? Math.round(rows.reduce((sum, r) => sum + r.readiness, 0) / rows.length) : 0,
    placementRate: rows.length ? Math.round((placed / rows.length) * 100) : 0,
    byDepartment,
    domainAdoption,
    topGaps,
    industryDemand,
    applicationFunnel,
    recentActivity,
  };
}
