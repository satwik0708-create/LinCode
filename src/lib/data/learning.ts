import "server-only";
import { mutate, newId, nowIso, read } from "./store";
import { getStudentProfile, upsertStudentProfile } from "./users";
import { buildDiagnostic, buildModuleQuiz, getQuestion } from "@/lib/domain/questions";
import { modulesForDomain } from "@/lib/domain/curriculum";
import { placeLearner } from "@/lib/domain/placement";
import { computeDomainCompletion } from "@/lib/domain/completion";
import type {
  Assessment, AssessmentResult, DomainEnrollment, LearningLevel, LearningPath,
  LearningProgress, LearningStreak, SkillSignal, StreakActivityType,
} from "@/lib/types";

const ASSESSMENT_TTL_MINUTES = 90;
/** Short on purpose: a checkpoint after one subtopic, not a second diagnostic. */
export const MODULE_QUIZ_SIZE = 5;
/**
 * How much a checkpoint has to overcome the score already on record, expressed
 * as the number of questions the existing signal is worth. At 2, one question
 * moves a skill a third of the way; five questions move it most of the way.
 */
const CHECKPOINT_PRIOR_WEIGHT = 2;

/* ---------------- Enrollments ---------------- */

export async function enrollDomains(
  userId: string,
  selections: Array<{ domainId: string; level: LearningLevel }>,
): Promise<DomainEnrollment[]> {
  const profile = await getStudentProfile(userId);
  const existing = profile?.enrollments ?? [];

  const merged: DomainEnrollment[] = [...existing];
  for (const { domainId, level } of selections) {
    const found = merged.find((e) => e.domainId === domainId);
    if (found) {
      // Re-declaring a level resets placement so the diagnostic runs again.
      if (found.declaredLevel !== level) {
        found.declaredLevel = level;
        found.placedLevel = level === "beginner" ? "beginner" : null;
        found.placementScore = null;
      }
    } else {
      merged.push({
        domainId,
        declaredLevel: level,
        placedLevel: level === "beginner" ? "beginner" : null,
        placementScore: null,
        status: "not_started",
        progress: 0,
        enrolledAt: nowIso(),
      });
    }
  }

  await upsertStudentProfile(userId, { enrollments: merged });
  return merged;
}

export async function getEnrollment(userId: string, domainId: string): Promise<DomainEnrollment | undefined> {
  const profile = await getStudentProfile(userId);
  return profile?.enrollments.find((e) => e.domainId === domainId);
}

/* ---------------- Assessments ---------------- */

export async function createAssessment(
  userId: string,
  domainId: string,
  declaredLevel: LearningLevel,
  size = 10,
): Promise<Assessment> {
  const questions = buildDiagnostic(domainId, declaredLevel, size);
  return mutate((db) => {
    const assessment: Assessment = {
      id: newId("asm"),
      userId,
      domainId,
      kind: "placement",
      declaredLevel,
      questionIds: questions.map((q) => q.id),
      createdAt: nowIso(),
      expiresAt: new Date(Date.now() + ASSESSMENT_TTL_MINUTES * 60_000).toISOString(),
    };
    db.assessments.push(assessment);
    return assessment;
  });
}

/**
 * The checkpoint quiz that follows a module.
 *
 * Kind "module" rather than "placement": passing one is evidence about the
 * subtopic just studied, not a reason to move the student to a different track.
 */
export async function createModuleQuiz(
  userId: string,
  domainId: string,
  moduleId: string,
  moduleSkills: string[],
  moduleLevel: LearningLevel,
  size = MODULE_QUIZ_SIZE,
): Promise<Assessment> {
  const questions = buildModuleQuiz(domainId, moduleSkills, moduleLevel, size);
  return mutate((db) => {
    const assessment: Assessment = {
      id: newId("asm"),
      userId,
      domainId,
      kind: "module",
      moduleId,
      declaredLevel: moduleLevel,
      questionIds: questions.map((q) => q.id),
      createdAt: nowIso(),
      expiresAt: new Date(Date.now() + ASSESSMENT_TTL_MINUTES * 60_000).toISOString(),
    };
    db.assessments.push(assessment);
    return assessment;
  });
}

export async function getAssessment(id: string): Promise<Assessment | undefined> {
  const db = await read();
  return db.assessments.find((a) => a.id === id);
}

/**
 * Grade a submission and place the learner.
 *
 * Grading happens entirely on the server against the stored question ids; the
 * client only ever sent option indices, and never received the answer key.
 */
export async function gradeAssessment(
  assessment: Assessment,
  answers: Record<string, number>,
): Promise<AssessmentResult> {
  const perSkill = new Map<string, { correct: number; total: number }>();
  let correctCount = 0;

  for (const qid of assessment.questionIds) {
    const q = getQuestion(qid);
    if (!q) continue;
    const bucket = perSkill.get(q.skillId) ?? { correct: 0, total: 0 };
    bucket.total += 1;
    if (answers[qid] === q.correctIndex) {
      bucket.correct += 1;
      correctCount += 1;
    }
    perSkill.set(q.skillId, bucket);
  }

  const totalCount = assessment.questionIds.length;
  const scorePercent = totalCount === 0 ? 0 : Math.round((correctCount / totalCount) * 100);
  const placed = placeLearner(assessment.declaredLevel, scorePercent);

  const skillScores: Record<string, number> = {};
  for (const [skillId, { correct, total }] of perSkill) {
    skillScores[skillId] = Math.round((correct / total) * 100);
  }

  const result: AssessmentResult = {
    id: newId("res"),
    assessmentId: assessment.id,
    userId: assessment.userId,
    domainId: assessment.domainId,
    scorePercent,
    correctCount,
    totalCount,
    declaredLevel: assessment.declaredLevel,
    placedLevel: placed.level,
    skillScores,
    moduleId: assessment.moduleId,
    createdAt: nowIso(),
  };

  await mutate((db) => {
    const stored = db.assessments.find((a) => a.id === assessment.id);
    if (stored) stored.submittedAt = nowIso();
    db.assessmentResults.push(result);
  });

  await applyAssessmentToProfile(
    result,
    assessment.kind,
    new Map([...perSkill].map(([skillId, { total }]) => [skillId, total])),
  );
  await recordActivity(assessment.userId, "assessment_completed", assessment.domainId, 25);
  return result;
}

/** Fold assessment evidence into the student's skill matrix and enrollment. */
async function applyAssessmentToProfile(
  result: AssessmentResult,
  kind: Assessment["kind"] = "placement",
  questionsPerSkill: Map<string, number> = new Map(),
): Promise<void> {
  const profile = await getStudentProfile(result.userId);
  if (!profile) return;

  const skillMatrix = { ...profile.skillMatrix };
  for (const [skillId, score] of Object.entries(result.skillScores)) {
    const previous = skillMatrix[skillId];
    // Assessment evidence outranks self-reports; between two assessments, keep
    // the more recent signal so improvement is visible.
    if (previous && previous.source === "verified") continue;

    // A ten-question diagnostic speaks for itself and replaces what came
    // before. A checkpoint may rest on a single question, which is far too
    // thin to overwrite a diagnostic outright — so it moves the existing score
    // toward its own, weighted by how many questions actually backed it.
    let next = score;
    if (kind === "module" && previous) {
      const asked = questionsPerSkill.get(skillId) ?? 1;
      const weight = asked / (asked + CHECKPOINT_PRIOR_WEIGHT);
      next = Math.round(previous.score * (1 - weight) + score * weight);
    }

    skillMatrix[skillId] = {
      skillId,
      score: next,
      strength: next >= 75 ? "strong" : next >= 45 ? "developing" : "weak",
      source: "assessment",
      verified: false,
      updatedAt: nowIso(),
    } satisfies SkillSignal;
  }

  // Only a diagnostic places a learner. A module checkpoint is evidence about
  // one subtopic — letting a five-question quiz rewrite the whole track would
  // undo the placement the diagnostic earned.
  const enrollments =
    kind === "placement"
      ? profile.enrollments.map((e) =>
          e.domainId === result.domainId
            ? {
                ...e,
                placedLevel: result.placedLevel,
                placementScore: result.scorePercent,
                status: e.status === "not_started" ? ("in_progress" as const) : e.status,
              }
            : e,
        )
      : profile.enrollments;

  await upsertStudentProfile(result.userId, { skillMatrix, enrollments });
}

export async function latestResult(userId: string, domainId: string): Promise<AssessmentResult | undefined> {
  const db = await read();
  return db.assessmentResults
    .filter((r) => r.userId === userId && r.domainId === domainId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
}

export async function listResults(userId: string): Promise<AssessmentResult[]> {
  const db = await read();
  return db.assessmentResults
    .filter((r) => r.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/* ---------------- Learning paths ---------------- */

export async function saveLearningPath(path: LearningPath): Promise<void> {
  await mutate((db) => {
    const index = db.learningPaths.findIndex((p) => p.userId === path.userId && p.domainId === path.domainId);
    if (index >= 0) db.learningPaths[index] = path;
    else db.learningPaths.push(path);
  });
}

export async function getLearningPath(userId: string, domainId: string): Promise<LearningPath | undefined> {
  const db = await read();
  return db.learningPaths.find((p) => p.userId === userId && p.domainId === domainId);
}

/* ---------------- Progress ---------------- */

export async function listProgress(userId: string, domainId?: string): Promise<LearningProgress[]> {
  const db = await read();
  return db.learningProgress.filter((p) => p.userId === userId && (!domainId || p.domainId === domainId));
}

export async function setModuleProgress(
  userId: string,
  domainId: string,
  moduleId: string,
  status: LearningProgress["status"],
): Promise<LearningProgress> {
  const record = await mutate((db) => {
    let entry = db.learningProgress.find((p) => p.userId === userId && p.moduleId === moduleId);
    const now = nowIso();
    if (!entry) {
      entry = {
        id: newId("prog"), userId, domainId, moduleId,
        status: "not_started", percent: 0, updatedAt: now,
      };
      db.learningProgress.push(entry);
    }
    entry.status = status;
    entry.percent = status === "completed" ? 100 : status === "in_progress" ? Math.max(entry.percent, 10) : 0;
    if (status !== "not_started") entry.startedAt ??= now;
    entry.completedAt = status === "completed" ? now : undefined;
    entry.updatedAt = now;
    return entry;
  });

  await recomputeDomainProgress(userId, domainId);
  return record;
}

/** Recalculate the 0-100 progress figure and completion state for one domain. */
export async function recomputeDomainProgress(userId: string, domainId: string): Promise<number> {
  const [profile, progress] = await Promise.all([getStudentProfile(userId), listProgress(userId, domainId)]);
  if (!profile) return 0;

  const modules = modulesForDomain(domainId);
  const path = await getLearningPath(userId, domainId);

  const completed = new Set(progress.filter((p) => p.status === "completed").map((p) => p.moduleId));
  // Modules skipped on demonstrated competency leave the denominator; modules
  // the learner actually completed stay in it and count toward the numerator.
  const { percent } = computeDomainCompletion(path, modules, completed);

  const enrollments = profile.enrollments.map((e) => {
    if (e.domainId !== domainId) return e;
    const done = percent >= 100;
    return {
      ...e,
      progress: percent,
      status: done ? ("completed" as const) : percent > 0 ? ("in_progress" as const) : e.status,
      completedAt: done ? (e.completedAt ?? nowIso()) : undefined,
    };
  });

  // Completing a module is evidence of the skills it teaches; nudge those
  // signals upward unless a stronger assessment signal already exists.
  const skillMatrix = { ...profile.skillMatrix };
  for (const moduleId of completed) {
    const mod = modules.find((m) => m.id === moduleId);
    if (!mod) continue;
    for (const skillId of mod.skillIds) {
      const prev = skillMatrix[skillId];
      const target = Math.min(80, (prev?.score ?? 0) + 12);
      if (!prev || (prev.source !== "assessment" && prev.source !== "verified" && prev.score < target)) {
        skillMatrix[skillId] = {
          skillId, score: target,
          strength: target >= 75 ? "strong" : target >= 45 ? "developing" : "weak",
          source: "module", verified: false, updatedAt: nowIso(),
        };
      }
    }
  }

  await upsertStudentProfile(userId, { enrollments, skillMatrix });
  return percent;
}

/* ---------------- Streaks ---------------- */

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function dayDiff(a: string, b: string): number {
  return Math.round((Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / 86_400_000);
}

/**
 * Record a qualifying learning action and roll the streak forward.
 *
 * Only meaningful activity counts — completing a module, a quiz, an assessment
 * or a project. Page views deliberately never reach this function.
 */
export async function recordActivity(
  userId: string,
  type: StreakActivityType,
  domainId?: string,
  minutes = 15,
  moduleId?: string,
): Promise<LearningStreak> {
  return mutate((db) => {
    const day = today();
    db.streakActivities.push({
      id: newId("act"), userId, type, day, domainId, moduleId, minutes, createdAt: nowIso(),
    });

    let streak = db.streaks.find((s) => s.userId === userId);
    if (!streak) {
      streak = { userId, current: 0, longest: 0, lastActiveDay: null, history: {}, updatedAt: nowIso() };
      db.streaks.push(streak);
    }

    streak.history[day] = (streak.history[day] ?? 0) + 1;

    if (streak.lastActiveDay === day) {
      // Already counted today; extra activity does not inflate the streak.
    } else if (streak.lastActiveDay && dayDiff(day, streak.lastActiveDay) === 1) {
      streak.current += 1;
    } else {
      streak.current = 1;
    }

    streak.lastActiveDay = day;
    streak.longest = Math.max(streak.longest, streak.current);
    streak.updatedAt = nowIso();
    return streak;
  });
}

export async function getStreak(userId: string): Promise<LearningStreak> {
  const db = await read();
  const stored = db.streaks.find((s) => s.userId === userId);
  if (!stored) {
    return { userId, current: 0, longest: 0, lastActiveDay: null, history: {}, updatedAt: nowIso() };
  }
  // A streak that was not extended yesterday or today is already broken; report
  // it honestly on read rather than waiting for the next write.
  const day = today();
  if (stored.lastActiveDay && dayDiff(day, stored.lastActiveDay) > 1) {
    return { ...stored, current: 0 };
  }
  return stored;
}
