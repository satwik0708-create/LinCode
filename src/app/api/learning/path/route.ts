import { z } from "zod";
import { ok, fail, readJson, rateLimit, requireSameOrigin, serverError } from "@/lib/api";
import { RATE_LIMITS } from "@/lib/auth/rate-limit";
import { domainIdSchema } from "@/lib/auth/validation";
import { authorize } from "@/lib/auth/guard";
import { getEnrollment } from "@/lib/data/learning";
import { generatePath } from "@/lib/services/student";

const schema = z.object({ domainId: domainIdSchema });

export async function POST(request: Request) {
  const blocked = await requireSameOrigin();
  if (blocked) return blocked;
  const limited = rateLimit(request, "path", RATE_LIMITS.ai);
  if (limited) return limited;

  const auth = await authorize("student");
  if (!auth.ok) return fail(auth.message, auth.status);

  const parsed = await readJson(request, schema);
  if (!parsed.ok) return parsed.response;

  try {
    const enrollment = await getEnrollment(auth.user.id, parsed.data.domainId);
    if (!enrollment) return fail("You are not enrolled in this domain.", 403);

    const path = await generatePath(auth.user.id, parsed.data.domainId);
    return ok({ steps: path?.steps.length ?? 0 });
  } catch (error) {
    return serverError("regenerate path", error);
  }
}
