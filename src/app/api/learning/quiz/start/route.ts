import { ok, fail, readJson, rateLimit, requireSameOrigin, serverError } from "@/lib/api";
import { startModuleQuizSchema } from "@/lib/auth/validation";
import { RATE_LIMITS } from "@/lib/auth/rate-limit";
import { authorize } from "@/lib/auth/guard";
import { createModuleQuiz, getEnrollment, listProgress } from "@/lib/data/learning";
import { getModule } from "@/lib/domain/curriculum";
import { getQuestion, toClientQuestion } from "@/lib/domain/questions";

/**
 * Start the checkpoint quiz for a module the student has completed.
 *
 * The gate is completion, not a client flag: a quiz for a module they have not
 * finished would be testing material they were never shown.
 */
export async function POST(request: Request) {
  const blocked = await requireSameOrigin();
  if (blocked) return blocked;
  const limited = rateLimit(request, "quiz-start", RATE_LIMITS.mutation);
  if (limited) return limited;

  const auth = await authorize("student");
  if (!auth.ok) return fail(auth.message, auth.status);

  const parsed = await readJson(request, startModuleQuizSchema);
  if (!parsed.ok) return parsed.response;
  const { domainId, moduleId } = parsed.data;

  try {
    const mod = getModule(moduleId);
    if (!mod || mod.domainId !== domainId) return fail("Unknown module.", 404);

    const enrollment = await getEnrollment(auth.user.id, domainId);
    if (!enrollment) return fail("You are not enrolled in this domain.", 403);

    const progress = await listProgress(auth.user.id, domainId);
    const done = progress.some((p) => p.moduleId === moduleId && p.status === "completed");
    if (!done) return fail("Finish the module before taking its checkpoint.", 409);

    const assessment = await createModuleQuiz(auth.user.id, domainId, moduleId, mod.skillIds, mod.level);
    if (assessment.questionIds.length === 0) {
      return fail("No checkpoint questions are available for this module yet.", 404);
    }

    // The answer key never reaches the browser — it is added back only when
    // the report is built, after the submission has been graded and stored.
    const questions = assessment.questionIds
      .map((id) => getQuestion(id))
      .filter((q): q is NonNullable<typeof q> => !!q)
      .map(toClientQuestion);

    return ok({
      assessmentId: assessment.id,
      moduleTitle: mod.title,
      questions,
      expiresAt: assessment.expiresAt,
    });
  } catch (error) {
    return serverError("module quiz start", error);
  }
}
