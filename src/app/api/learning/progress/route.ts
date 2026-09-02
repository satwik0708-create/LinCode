import { ok, fail, readJson, rateLimit, requireSameOrigin, serverError } from "@/lib/api";
import { progressSchema } from "@/lib/auth/validation";
import { RATE_LIMITS } from "@/lib/auth/rate-limit";
import { authorize } from "@/lib/auth/guard";
import { getEnrollment, recordActivity, setModuleProgress } from "@/lib/data/learning";
import { getModule } from "@/lib/domain/curriculum";
import { getStreak } from "@/lib/data/learning";

/**
 * Records module progress and, when a module is completed, logs a qualifying
 * streak activity. Page views never reach this endpoint — only real completions
 * count toward a streak.
 */
export async function POST(request: Request) {
  const blocked = await requireSameOrigin();
  if (blocked) return blocked;
  const limited = rateLimit(request, "progress", RATE_LIMITS.mutation);
  if (limited) return limited;

  const auth = await authorize("student");
  if (!auth.ok) return fail(auth.message, auth.status);

  const parsed = await readJson(request, progressSchema);
  if (!parsed.ok) return parsed.response;
  const { domainId, moduleId, status, minutes } = parsed.data;

  try {
    // The module must exist and belong to the domain the caller named, and the
    // student must actually be enrolled in it.
    const mod = getModule(moduleId);
    if (!mod || mod.domainId !== domainId) return fail("Unknown module.", 404);

    const enrollment = await getEnrollment(auth.user.id, domainId);
    if (!enrollment) return fail("You are not enrolled in this domain.", 403);

    await setModuleProgress(auth.user.id, domainId, moduleId, status);

    let streak = await getStreak(auth.user.id);
    if (status === "completed") {
      streak = await recordActivity(auth.user.id, "module_completed", domainId, minutes || 30, moduleId);
    }

    return ok({ streak });
  } catch (error) {
    return serverError("learning progress", error);
  }
}
