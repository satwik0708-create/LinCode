import type {
  AssessmentResult, LearningLevel, LearningModule, LearningPath, LearningProgress,
  Opportunity, SkillGapReport, SkillSignal, StudentProfile,
} from "@/lib/types";

/**
 * The contract between the application and whatever produces recommendations.
 *
 * The MVP ships a deterministic rule-based implementation. Swapping in a real
 * model means writing a second `SkillEngine` — no screen, route or repository
 * changes, and no provider SDK leaks into the UI.
 */

export interface EngineContext {
  profile: StudentProfile;
  /** Every signal the platform has about this learner, keyed by skill id. */
  skillMatrix: Record<string, SkillSignal>;
  results: AssessmentResult[];
  progress: LearningProgress[];
  /** Catalogue metadata for the domain under consideration. */
  modules: LearningModule[];
  /** Live industry demand, derived from open postings. */
  marketRequirements: Opportunity[];
}

export interface CareerRecommendation {
  role: string;
  domainId: string;
  fitScore: number;
  reason: string;
  missingSkillIds: string[];
  demandIndex: number;
  medianSalaryLpa: number;
}

export interface OpportunityMatch {
  opportunityId: string;
  matchScore: number;
  /** Per-requirement verdict, in the order the employer listed them. */
  breakdown: Array<{
    skillId: string;
    skillName: string;
    required: number;
    have: number;
    verdict: "met" | "partial" | "missing";
    mandatory: boolean;
  }>;
  eligible: boolean;
  ineligibleReasons: string[];
}

export interface AdvisorAnswer {
  answer: string;
  bullets: string[];
  suggestedActions: Array<{ label: string; href: string }>;
  confidence: "high" | "medium" | "low";
}

export interface SkillEngine {
  readonly name: string;

  /** Compare what the learner has against what the domain and market require. */
  analyseSkillGap(domainId: string, ctx: EngineContext): SkillGapReport;

  /** Order modules for this learner, marking what they can skip and why. */
  buildLearningPath(domainId: string, level: LearningLevel, ctx: EngineContext): LearningPath;

  /** Score one opportunity against the learner's profile. */
  matchOpportunity(opportunity: Opportunity, ctx: EngineContext): OpportunityMatch;

  /** Rank career paths by fit against current skills and market demand. */
  recommendCareers(ctx: EngineContext): CareerRecommendation[];

  /** Answer a free-text career question from the learner's own data. */
  advise(question: string, ctx: EngineContext, domainId?: string): AdvisorAnswer;
}
