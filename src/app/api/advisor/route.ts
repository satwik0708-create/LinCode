import { ok, fail, readJson, rateLimit, requireSameOrigin, serverError } from "@/lib/api";
import { advisorSchema } from "@/lib/auth/validation";
import { RATE_LIMITS } from "@/lib/auth/rate-limit";
import { authorize } from "@/lib/auth/guard";
import { buildEngineContext } from "@/lib/services/student";
import { getSkillEngine } from "@/lib/ai";

/**
 * Career advisor.
 *
 * The engine only ever sees the authenticated student's own context, assembled
 * server-side — the request carries a question, never a user id or a profile.
 */
export async function POST(request: Request) {
  const blocked = await requireSameOrigin();
  if (blocked) return blocked;
  const limited = rateLimit(request, "advisor", RATE_LIMITS.ai);
  if (limited) return limited;

  const auth = await authorize("student");
  if (!auth.ok) return fail(auth.message, auth.status);

  const parsed = await readJson(request, advisorSchema);
  if (!parsed.ok) return parsed.response;

  try {
    const ctx = await buildEngineContext(auth.user.id);
    if (!ctx) return fail("Complete your profile to use the advisor.", 400);

    const answer = getSkillEngine().advise(parsed.data.question, ctx, parsed.data.domainId);
    return ok({ answer });
  } catch (error) {
    return serverError("advisor", error);
  }
}
