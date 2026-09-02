import { ok, fail, readJson, rateLimit, requireSameOrigin, serverError } from "@/lib/api";
import { applyProgramSchema } from "@/lib/auth/validation";
import { RATE_LIMITS } from "@/lib/auth/rate-limit";
import { authorize } from "@/lib/auth/guard";
import { applyToProgram, getCollaborationProgram } from "@/lib/data/opportunities";
import { audit, pushNotification } from "@/lib/data/users";

/**
 * Apply to a collaboration programme.
 *
 * A programme declares which roles it is open to. That audience list is the
 * authorisation boundary — a student cannot join a faculty-only FDP by posting
 * its id, and the check lives in the repository so no caller can skip it.
 */
export async function POST(request: Request) {
  const blocked = await requireSameOrigin();
  if (blocked) return blocked;
  const limited = rateLimit(request, "program-apply", RATE_LIMITS.mutation);
  if (limited) return limited;

  const auth = await authorize();
  if (!auth.ok) return fail(auth.message, auth.status);

  const role = auth.user.activeRole ?? auth.user.roles[0];
  if (!role) return fail("No role assigned.", 403);

  const parsed = await readJson(request, applyProgramSchema);
  if (!parsed.ok) return parsed.response;

  try {
    const result = await applyToProgram({
      programId: parsed.data.programId,
      applicantId: auth.user.id,
      applicantRole: role,
      note: parsed.data.note,
    });

    if ("error" in result) {
      if (result.error === "duplicate") return fail("You have already applied to this programme.", 409);
      if (result.error === "forbidden") {
        await audit({ userId: auth.user.id, action: "program.apply", outcome: "denied", detail: parsed.data.programId });
        return fail("This programme is not open to your role.", 403);
      }
      return fail("That programme is no longer open.", 404);
    }

    const program = await getCollaborationProgram(parsed.data.programId);
    if (program) {
      await pushNotification({
        userId: program.postedByUserId,
        title: "New programme application",
        body: `${auth.user.name} applied to ${program.title}.`,
        kind: "info",
        href: "/industry/applicants",
      });
    }

    await audit({ userId: auth.user.id, action: "program.apply", outcome: "success", detail: parsed.data.programId });
    return ok({ application: result }, { status: 201 });
  } catch (error) {
    return serverError("program apply", error);
  }
}
