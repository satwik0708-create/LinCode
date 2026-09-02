import { z } from "zod";
import { ok, fail, readJson, rateLimit, requireSameOrigin, serverError } from "@/lib/api";
import { RATE_LIMITS } from "@/lib/auth/rate-limit";
import { authorize } from "@/lib/auth/guard";
import { withdrawApplication } from "@/lib/data/opportunities";
import { audit } from "@/lib/data/users";

const schema = z.object({ applicationId: z.string().trim().min(4).max(64) });

export async function POST(request: Request) {
  const blocked = await requireSameOrigin();
  if (blocked) return blocked;
  const limited = rateLimit(request, "withdraw", RATE_LIMITS.mutation);
  if (limited) return limited;

  const auth = await authorize("student");
  if (!auth.ok) return fail(auth.message, auth.status);

  const parsed = await readJson(request, schema);
  if (!parsed.ok) return parsed.response;

  try {
    // Ownership is enforced inside the repository, so the check cannot be
    // skipped by a future caller that forgets it.
    const done = await withdrawApplication(parsed.data.applicationId, auth.user.id);
    if (!done) {
      await audit({ userId: auth.user.id, action: "application.withdraw", outcome: "denied", detail: parsed.data.applicationId });
      return fail("That application cannot be withdrawn.", 403);
    }
    return ok({ withdrawn: true });
  } catch (error) {
    return serverError("withdraw", error);
  }
}
