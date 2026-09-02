import { ok, fail, readJson, rateLimit, requireSameOrigin, serverError } from "@/lib/api";
import { startAssessmentSchema } from "@/lib/auth/validation";
import { RATE_LIMITS } from "@/lib/auth/rate-limit";
import { authorize } from "@/lib/auth/guard";
import { createAssessment } from "@/lib/data/learning";
import { getQuestion, toClientQuestion } from "@/lib/domain/questions";
import { DEFAULT_PLACEMENT_POLICY } from "@/lib/domain/placement";

export async function POST(request: Request) {
  const blocked = await requireSameOrigin();
  if (blocked) return blocked;
  const limited = rateLimit(request, "assessment-start", RATE_LIMITS.mutation);
  if (limited) return limited;

  const auth = await authorize("student");
  if (!auth.ok) return fail(auth.message, auth.status);

  const parsed = await readJson(request, startAssessmentSchema);
  if (!parsed.ok) return parsed.response;

  try {
    const assessment = await createAssessment(
      auth.user.id,
      parsed.data.domainId,
      parsed.data.declaredLevel,
      DEFAULT_PLACEMENT_POLICY.questionCount,
    );

    // toClientQuestion strips correctIndex and explanation. The answer key
    // never reaches the browser, so the test cannot be beaten by reading it.
    const questions = assessment.questionIds
      .map((id) => getQuestion(id))
      .filter((q): q is NonNullable<typeof q> => !!q)
      .map(toClientQuestion);

    return ok({ assessmentId: assessment.id, questions, expiresAt: assessment.expiresAt });
  } catch (error) {
    return serverError("assessment start", error);
  }
}
