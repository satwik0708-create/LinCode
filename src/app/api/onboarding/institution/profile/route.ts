import { ok, fail, readJson, rateLimit, requireSameOrigin, serverError } from "@/lib/api";
import { institutionProfileSchema } from "@/lib/auth/validation";
import { RATE_LIMITS } from "@/lib/auth/rate-limit";
import { authorize } from "@/lib/auth/guard";
import { PROFILE_HANDLERS } from "@/lib/services/profiles";

export async function POST(request: Request) {
  const blocked = await requireSameOrigin();
  if (blocked) return blocked;
  const limited = rateLimit(request, "onboard-institution", RATE_LIMITS.mutation);
  if (limited) return limited;

  const auth = await authorize("institution");
  if (!auth.ok) return fail(auth.message, auth.status);

  const parsed = await readJson(request, institutionProfileSchema);
  if (!parsed.ok) return parsed.response;

  try {
    const next = await PROFILE_HANDLERS.institution(auth.user.id, parsed.data);
    return ok({ next });
  } catch (error) {
    return serverError("institution profile", error);
  }
}
