import { z } from "zod";
import { ok, fail, readJson, rateLimit, requireSameOrigin, serverError } from "@/lib/api";
import { RATE_LIMITS } from "@/lib/auth/rate-limit";
import { authorize } from "@/lib/auth/guard";
import { setOpportunityStatus } from "@/lib/data/opportunities";
import { audit } from "@/lib/data/users";

const schema = z.object({
  opportunityId: z.string().trim().min(4).max(64),
  status: z.enum(["open", "closed"]),
});

export async function POST(request: Request) {
  const blocked = await requireSameOrigin();
  if (blocked) return blocked;
  const limited = rateLimit(request, "opportunity-status", RATE_LIMITS.mutation);
  if (limited) return limited;

  const auth = await authorize("industry");
  if (!auth.ok) return fail(auth.message, auth.status);
  if (!auth.user.organizationId) return fail("Complete your organisation profile first.", 400);

  const parsed = await readJson(request, schema);
  if (!parsed.ok) return parsed.response;

  try {
    // Ownership is verified inside the repository against the posting's own
    // organizationId, not against anything the client sent.
    const done = await setOpportunityStatus(parsed.data.opportunityId, auth.user.organizationId, parsed.data.status);
    if (!done) {
      await audit({ userId: auth.user.id, action: "opportunity.status", outcome: "denied", detail: parsed.data.opportunityId });
      return fail("You do not have access to that posting.", 403);
    }
    return ok({ status: parsed.data.status });
  } catch (error) {
    return serverError("opportunity status", error);
  }
}
