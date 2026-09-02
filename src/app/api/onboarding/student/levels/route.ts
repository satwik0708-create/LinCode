import { ok, fail, readJson, rateLimit, requireSameOrigin, serverError } from "@/lib/api";
import { setLevelsSchema } from "@/lib/auth/validation";
import { RATE_LIMITS } from "@/lib/auth/rate-limit";
import { authorize } from "@/lib/auth/guard";
import { enrollDomains } from "@/lib/data/learning";
import { generatePath } from "@/lib/services/student";
import { requiresDiagnostic } from "@/lib/domain/placement";
import type { LearningLevel } from "@/lib/types";

/**
 * Sets the declared level per domain and reports which domains still need a
 * diagnostic. Beginners skip the test and get a path immediately; intermediate
 * and advanced learners must prove the level they claimed.
 */
export async function POST(request: Request) {
  const blocked = await requireSameOrigin();
  if (blocked) return blocked;
  const limited = rateLimit(request, "onboard-levels", RATE_LIMITS.mutation);
  if (limited) return limited;

  const auth = await authorize("student");
  if (!auth.ok) return fail(auth.message, auth.status);

  const parsed = await readJson(request, setLevelsSchema);
  if (!parsed.ok) return parsed.response;

  try {
    const selections = Object.entries(parsed.data.levels).map(([domainId, level]) => ({
      domainId,
      level: level as LearningLevel,
    }));
    if (selections.length === 0) return fail("Choose a level for each domain.", 422);

    await enrollDomains(auth.user.id, selections);

    const needsAssessment = selections.filter((s) => requiresDiagnostic(s.level)).map((s) => s.domainId);

    // Beginners can have their path built right away.
    await Promise.all(
      selections.filter((s) => !requiresDiagnostic(s.level)).map((s) => generatePath(auth.user.id, s.domainId)),
    );

    return ok({
      needsAssessment,
      next: needsAssessment.length
        ? `/onboarding/student/assessment?domain=${needsAssessment[0]}`
        : "/onboarding/student/personalized-path",
    });
  } catch (error) {
    return serverError("level selection", error);
  }
}
