import { ok, fail, readJson, rateLimit, requireSameOrigin, serverError } from "@/lib/api";
import { addDomainSchema } from "@/lib/auth/validation";
import { RATE_LIMITS } from "@/lib/auth/rate-limit";
import { authorize } from "@/lib/auth/guard";
import { enrollDomains } from "@/lib/data/learning";
import { generatePath } from "@/lib/services/student";
import { requiresDiagnostic } from "@/lib/domain/placement";
import type { LearningLevel } from "@/lib/types";

/**
 * Adds a domain to an existing learner at any time. Completing one domain never
 * removes the others, and there is no cap on how many a student can hold.
 */
export async function POST(request: Request) {
  const blocked = await requireSameOrigin();
  if (blocked) return blocked;
  const limited = rateLimit(request, "add-domain", RATE_LIMITS.mutation);
  if (limited) return limited;

  const auth = await authorize("student");
  if (!auth.ok) return fail(auth.message, auth.status);

  const parsed = await readJson(request, addDomainSchema);
  if (!parsed.ok) return parsed.response;
  const { domainId, level } = parsed.data;

  try {
    await enrollDomains(auth.user.id, [{ domainId, level: level as LearningLevel }]);

    if (requiresDiagnostic(level as LearningLevel)) {
      return ok({ next: `/student/assessment?domain=${domainId}`, needsAssessment: true });
    }

    await generatePath(auth.user.id, domainId);
    return ok({ next: `/student/learning/${domainId}`, needsAssessment: false });
  } catch (error) {
    return serverError("add domain", error);
  }
}
