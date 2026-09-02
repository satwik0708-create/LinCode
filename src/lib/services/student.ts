import "server-only";
import { getStudentProfile } from "@/lib/data/users";
import { getLearningPath, listProgress, listResults, saveLearningPath, getStreak } from "@/lib/data/learning";
import { listApplicationsForStudent, listOpportunities } from "@/lib/data/opportunities";
import { getPortfolio } from "@/lib/data/portfolio";
import { MODULES } from "@/lib/domain/curriculum";
import { getDomain } from "@/lib/domain/domains";
import { skillName } from "@/lib/domain/skills";
import { getSkillEngine, type EngineContext, type OpportunityMatch } from "@/lib/ai";
import type {
  Application, DomainEnrollment, LearningLevel, LearningPath, Opportunity,
  SkillGapReport, StudentProfile,
} from "@/lib/types";

/**
 * Assembles the full input the recommendation engine needs, in one place.
 * Every AI call site uses this so the engine always sees the same shape.
 */
export async function buildEngineContext(userId: string): Promise<EngineContext | null> {
  const profile = await getStudentProfile(userId);
  if (!profile) return null;

  const [results, progress, marketRequirements] = await Promise.all([
    listResults(userId),
    listProgress(userId),
    listOpportunities(),
  ]);

  return {
    profile,
    skillMatrix: profile.skillMatrix,
    results,
    progress,
    modules: MODULES,
    marketRequirements,
  };
}

export interface DomainSnapshot {
  enrollment: DomainEnrollment;
  domainName: string;
  gradient: string;
  icon: string;
  completedModules: number;
  totalModules: number;
  nextModuleId: string | null;
  nextModuleTitle: string | null;
}

export async function getDomainSnapshots(userId: string): Promise<DomainSnapshot[]> {
  const [profile, progress] = await Promise.all([getStudentProfile(userId), listProgress(userId)]);
  if (!profile) return [];

  const completed = new Set(progress.filter((p) => p.status === "completed").map((p) => p.moduleId));

  return Promise.all(
    profile.enrollments.map(async (enrollment) => {
      const domain = getDomain(enrollment.domainId);
      const path = await getLearningPath(userId, enrollment.domainId);
      const domainModules = MODULES.filter((m) => m.domainId === enrollment.domainId);

      const required = path
        ? path.steps.filter((s) => s.status !== "skip")
        : domainModules.map((m) => ({ moduleId: m.id, status: "recommended" as const }));

      const next = required.find((s) => !completed.has(s.moduleId));
      const nextModule = next ? domainModules.find((m) => m.id === next.moduleId) : undefined;

      return {
        enrollment,
        domainName: domain?.name ?? enrollment.domainId,
        gradient: domain?.gradient ?? "from-slate-500 to-slate-600",
        icon: domain?.icon ?? "BookOpen",
        completedModules: required.filter((s) => completed.has(s.moduleId)).length,
        totalModules: required.length,
        nextModuleId: nextModule?.id ?? null,
        nextModuleTitle: nextModule?.title ?? null,
      };
    }),
  );
}

/** Generate (and persist) the personalised path for one domain. */
export async function generatePath(userId: string, domainId: string): Promise<LearningPath | null> {
  const ctx = await buildEngineContext(userId);
  if (!ctx) return null;
  const enrollment = ctx.profile.enrollments.find((e) => e.domainId === domainId);
  const level: LearningLevel = enrollment?.placedLevel ?? enrollment?.declaredLevel ?? "beginner";
  const path = getSkillEngine().buildLearningPath(domainId, level, ctx);
  await saveLearningPath(path);
  return path;
}

export async function getOrCreatePath(userId: string, domainId: string): Promise<LearningPath | null> {
  return (await getLearningPath(userId, domainId)) ?? generatePath(userId, domainId);
}

export async function getSkillGap(userId: string, domainId: string): Promise<SkillGapReport | null> {
  const ctx = await buildEngineContext(userId);
  if (!ctx) return null;
  return getSkillEngine().analyseSkillGap(domainId, ctx);
}

export interface MatchedOpportunity {
  opportunity: Opportunity;
  match: OpportunityMatch;
  applied: boolean;
}

export async function getMatchedOpportunities(
  userId: string,
  types?: Opportunity["type"][],
): Promise<MatchedOpportunity[]> {
  const ctx = await buildEngineContext(userId);
  if (!ctx) return [];

  const [opportunities, applications] = await Promise.all([
    listOpportunities({ types }),
    listApplicationsForStudent(userId),
  ]);
  const appliedIds = new Set(applications.map((a) => a.opportunityId));
  const engine = getSkillEngine();

  return opportunities
    .map((opportunity) => ({
      opportunity,
      match: engine.matchOpportunity(opportunity, ctx),
      applied: appliedIds.has(opportunity.id),
    }))
    .sort((a, b) => b.match.matchScore - a.match.matchScore);
}

export interface StudentOverview {
  profile: StudentProfile;
  domains: DomainSnapshot[];
  streak: Awaited<ReturnType<typeof getStreak>>;
  applications: Application[];
  topMatches: MatchedOpportunity[];
  primaryGap: SkillGapReport | null;
  portfolioCounts: { certifications: number; projects: number; achievements: number; verified: number };
  readiness: number;
}

export async function getStudentOverview(userId: string): Promise<StudentOverview | null> {
  const profile = await getStudentProfile(userId);
  if (!profile) return null;

  const [domains, streak, applications, matches, portfolio] = await Promise.all([
    getDomainSnapshots(userId),
    getStreak(userId),
    listApplicationsForStudent(userId),
    getMatchedOpportunities(userId),
    getPortfolio(userId),
  ]);

  const primaryDomainId =
    profile.enrollments.find((e) => e.status === "in_progress")?.domainId ?? profile.enrollments[0]?.domainId;
  const primaryGap = primaryDomainId ? await getSkillGap(userId, primaryDomainId) : null;

  const verified =
    portfolio.certifications.filter((c) => c.verified).length +
    portfolio.projects.filter((p) => p.verified).length +
    portfolio.achievements.filter((a) => a.verified).length;

  return {
    profile,
    domains,
    streak,
    applications,
    topMatches: matches.slice(0, 4),
    primaryGap,
    portfolioCounts: {
      certifications: portfolio.certifications.length,
      projects: portfolio.projects.length,
      achievements: portfolio.achievements.length,
      verified,
    },
    readiness: primaryGap?.readinessScore ?? 0,
  };
}

/** Shape a stored path into what the learning-path UI renders. */
export async function getPathView(userId: string, domainId: string) {
  const [path, progress] = await Promise.all([getOrCreatePath(userId, domainId), listProgress(userId, domainId)]);
  if (!path) return null;

  const completed = new Set(progress.filter((p) => p.status === "completed").map((p) => p.moduleId));

  const steps = path.steps
    .map((step) => {
      const mod = MODULES.find((m) => m.id === step.moduleId);
      if (!mod) return null;
      return {
        moduleId: mod.id,
        title: mod.title,
        summary: mod.summary,
        level: mod.level,
        estimatedMinutes: mod.estimatedMinutes,
        skills: mod.skillIds.map((id) => skillName(id)),
        status: step.status,
        rationale: step.rationale,
        completed: completed.has(mod.id),
        resources: mod.resources,
      };
    })
    .filter((s): s is NonNullable<typeof s> => s !== null);

  return { path, steps };
}
