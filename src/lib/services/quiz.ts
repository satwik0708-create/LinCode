import "server-only";
import { getQuestion } from "@/lib/domain/questions";
import { getModule, modulesForDomain } from "@/lib/domain/curriculum";
import { getDomain } from "@/lib/domain/domains";
import { skillName } from "@/lib/domain/skills";
import { getSkillGap } from "@/lib/services/student";
import type {
  Assessment, AssessmentResult, ModuleQuizGap, ModuleQuizReport, QuizReviewItem,
} from "@/lib/types";

/** Below this on a skill, the checkpoint counts it as a gap rather than a wobble. */
const GAP_THRESHOLD = 60;
/** Overall pass mark for the checkpoint. */
const PASS_MARK = 60;

/**
 * Turn a graded module checkpoint into a report the student can act on.
 *
 * The interesting half is not the score but the gaps: for each skill they got
 * wrong, what the domain currently expects of that skill, and which modules
 * teach it. That is built from the same gap analysis the Skill Gap page uses,
 * so a checkpoint report and the domain report never disagree.
 */
export async function buildModuleQuizReport(
  assessment: Assessment,
  result: AssessmentResult,
  answers: Record<string, number>,
): Promise<ModuleQuizReport> {
  const mod = assessment.moduleId ? getModule(assessment.moduleId) : undefined;
  const domain = getDomain(assessment.domainId);
  const gapReport = await getSkillGap(result.userId, assessment.domainId);

  const requiredFor = new Map(
    [
      ...(gapReport?.strong ?? []), ...(gapReport?.developing ?? []),
      ...(gapReport?.needsImprovement ?? []), ...(gapReport?.missing ?? []),
    ].map((entry) => [entry.skillId, entry.requiredScore]),
  );

  const review: QuizReviewItem[] = [];
  const perSkill = new Map<string, { missed: number; total: number }>();

  for (const questionId of assessment.questionIds) {
    const question = getQuestion(questionId);
    if (!question) continue;
    const chosen = answers[questionId];
    const chosenIndex = Number.isInteger(chosen) ? chosen : null;
    const correct = chosenIndex === question.correctIndex;

    const bucket = perSkill.get(question.skillId) ?? { missed: 0, total: 0 };
    bucket.total += 1;
    if (!correct) bucket.missed += 1;
    perSkill.set(question.skillId, bucket);

    review.push({
      questionId,
      prompt: question.prompt,
      options: question.options,
      skillId: question.skillId,
      skillName: skillName(question.skillId),
      chosenIndex,
      correctIndex: question.correctIndex,
      correct,
      explanation: question.explanation,
    });
  }

  // Modules that teach a skill, so a gap comes with somewhere to go.
  const domainModules = modulesForDomain(assessment.domainId);
  const revisitFor = (skillId: string) =>
    domainModules
      .filter((m) => m.skillIds.includes(skillId))
      .slice(0, 3)
      .map((m) => ({ moduleId: m.id, title: m.title }));

  const gaps: ModuleQuizGap[] = [];
  const strengths: ModuleQuizReport["strengths"] = [];

  for (const [skillId, { missed, total }] of perSkill) {
    const score = result.skillScores[skillId] ?? Math.round(((total - missed) / total) * 100);
    if (score < GAP_THRESHOLD) {
      gaps.push({
        skillId,
        skillName: skillName(skillId),
        score,
        requiredScore: requiredFor.get(skillId) ?? 70,
        missedCount: missed,
        totalCount: total,
        revisit: revisitFor(skillId),
      });
    } else {
      strengths.push({ skillId, skillName: skillName(skillId), score });
    }
  }

  gaps.sort((a, b) => b.requiredScore - b.score - (a.requiredScore - a.score));
  strengths.sort((a, b) => b.score - a.score);

  return {
    resultId: result.id,
    moduleId: assessment.moduleId ?? "",
    moduleTitle: mod?.title ?? "This module",
    domainId: assessment.domainId,
    domainName: domain?.name ?? assessment.domainId,
    scorePercent: result.scorePercent,
    correctCount: result.correctCount,
    totalCount: result.totalCount,
    passed: result.scorePercent >= PASS_MARK,
    summary: summarise(mod?.title ?? "this module", result.scorePercent, gaps),
    gaps,
    strengths,
    review,
  };
}

function summarise(moduleTitle: string, score: number, gaps: ModuleQuizGap[]): string {
  if (gaps.length === 0) {
    return `You scored ${score}% on ${moduleTitle} with no skill falling short. Nothing here needs revisiting — carry on to the next module.`;
  }
  const named = gaps.slice(0, 3).map((g) => `${g.skillName} (${g.score}% against ${g.requiredScore}% expected)`);
  const rest = gaps.length > 3 ? `, and ${gaps.length - 3} more` : "";
  return `You scored ${score}% on ${moduleTitle}. This checkpoint found gaps in ${named.join(", ")}${rest}. Each one lists the modules that teach it.`;
}
