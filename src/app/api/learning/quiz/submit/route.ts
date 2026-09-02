import { ok, fail, readJson, rateLimit, requireSameOrigin, serverError } from "@/lib/api";
import { submitAssessmentSchema } from "@/lib/auth/validation";
import { RATE_LIMITS } from "@/lib/auth/rate-limit";
import { authorize } from "@/lib/auth/guard";
import { getAssessment, gradeAssessment } from "@/lib/data/learning";
import { buildModuleQuizReport } from "@/lib/services/quiz";
import { generatePath } from "@/lib/services/student";
import { audit } from "@/lib/data/users";

/**
 * Grade a module checkpoint and return the report.
 *
 * Grading is server-side against the stored question ids, exactly as the
 * diagnostic is; the report is assembled afterwards, so the explanations it
 * carries cannot influence the score.
 */
export async function POST(request: Request) {
  const blocked = await requireSameOrigin();
  if (blocked) return blocked;
  const limited = rateLimit(request, "quiz-submit", RATE_LIMITS.mutation);
  if (limited) return limited;

  const auth = await authorize("student");
  if (!auth.ok) return fail(auth.message, auth.status);

  const parsed = await readJson(request, submitAssessmentSchema);
  if (!parsed.ok) return parsed.response;

  try {
    const assessment = await getAssessment(parsed.data.assessmentId);
    if (!assessment) return fail("That checkpoint no longer exists.", 404);
    if (assessment.kind !== "module") return fail("That is not a module checkpoint.", 400);

    // An assessment id is not a capability.
    if (assessment.userId !== auth.user.id) {
      await audit({ userId: auth.user.id, action: "quiz.submit", outcome: "denied", detail: assessment.id });
      return fail("You do not have access to this checkpoint.", 403);
    }
    if (assessment.submittedAt) return fail("This checkpoint has already been submitted.", 409);
    if (new Date(assessment.expiresAt).getTime() < Date.now()) {
      return fail("This checkpoint has expired. Start a new one.", 410);
    }

    const result = await gradeAssessment(assessment, parsed.data.answers);
    // The checkpoint changed the skill matrix, so the path it feeds is stale.
    await generatePath(auth.user.id, assessment.domainId);
    const report = await buildModuleQuizReport(assessment, result, parsed.data.answers);

    await audit({ userId: auth.user.id, action: "quiz.submit", outcome: "success", detail: assessment.id });
    return ok({ report });
  } catch (error) {
    return serverError("module quiz submit", error);
  }
}
