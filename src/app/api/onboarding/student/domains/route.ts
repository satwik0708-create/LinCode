import { ok, fail, readJson, rateLimit, requireSameOrigin, serverError } from "@/lib/api";
import { selectDomainsSchema } from "@/lib/auth/validation";
import { RATE_LIMITS } from "@/lib/auth/rate-limit";
import { authorize } from "@/lib/auth/guard";
import { getStudentProfile, upsertStudentProfile } from "@/lib/data/users";

/**
 * Records the domain selection without levels yet — levels are chosen per
 * domain on the next step. Selecting several domains is the normal case.
 */
export async function POST(request: Request) {
  const blocked = await requireSameOrigin();
  if (blocked) return blocked;
  const limited = rateLimit(request, "onboard-domains", RATE_LIMITS.mutation);
  if (limited) return limited;

  const auth = await authorize("student");
  if (!auth.ok) return fail(auth.message, auth.status);

  const parsed = await readJson(request, selectDomainsSchema);
  if (!parsed.ok) return parsed.response;

  try {
    const profile = await getStudentProfile(auth.user.id);
    const existing = profile?.enrollments ?? [];

    // Keep enrollments the student already has; add the newly chosen ones as
    // pending until a level is set. Nothing is ever removed here.
    const merged = [...existing];
    for (const domainId of parsed.data.domainIds) {
      if (!merged.some((e) => e.domainId === domainId)) {
        merged.push({
          domainId, declaredLevel: "beginner", placedLevel: null, placementScore: null,
          status: "not_started", progress: 0, enrolledAt: new Date().toISOString(),
        });
      }
    }

    await upsertStudentProfile(auth.user.id, { enrollments: merged });
    return ok({ next: "/onboarding/student/level", selected: parsed.data.domainIds });
  } catch (error) {
    return serverError("domain selection", error);
  }
}
