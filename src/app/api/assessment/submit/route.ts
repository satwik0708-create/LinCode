import { ok, fail, readJson, rateLimit, requireSameOrigin, serverError } from "@/lib/api";
import { submitAssessmentSchema } from "@/lib/auth/validation";
import { RATE_LIMITS } from "@/lib/auth/rate-limit";
import { authorize } from "@/lib/auth/guard";
import { getAssessment, gradeAssessment } from "@/lib/data/learning";
import { generatePath } from "@/lib/services/student";
import { placementExplanation } from "@/lib/domain/placement";
import { audit } from "@/lib/data/users";

export async function POST(request: Request) {
  const blocked = await requireSameOrigin();
  if (blocked) return blocked;
  const limited = rateLimit(request, "assessment-submit", RATE_LIMITS.mutation);
  if (limited) return limited;

  const auth = await authorize("student");
  if (!auth.ok) return fail(auth.message, auth.status);

  const parsed = await readJson(request, submitAssessmentSchema);
  if (!parsed.ok) return parsed.response;

  try {
    const assessment = await getAssessment(parsed.data.assessmentId);
    if (!assessment) return fail("That assessment no longer exists.", 404);

    // Ownership check: an assessment id is not a capability. Submitting to
    // someone else's assessment is denied and logged.
    if (assessment.userId !== auth.user.id) {
      await audit({ userId: auth.user.id, action: "assessment.submit", outcome: "denied", detail: assessment.id });
      return fail("You do not have access to this assessment.", 403);
    }
    if (assessment.submittedAt) return fail("This assessment has already been submitted.", 409);
    if (new Date(assessment.expiresAt).getTime() < Date.now()) {
      return fail("This assessment has expired. Start a new one.", 410);
    }

    const result = await gradeAssessment(assessment, parsed.data.answers);
    await generatePath(auth.user.id, assessment.domainId);

    return ok({
      result,
      explanation: placementExplanation(result.declaredLevel, result.placedLevel, result.scorePercent),
    });
  } catch (error) {
    return serverError("assessment submit", error);
  }
}
