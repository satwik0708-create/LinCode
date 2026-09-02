import { ok, fail, readJson, rateLimit, requireSameOrigin, serverError } from "@/lib/api";
import { enrollTrainingSchema } from "@/lib/auth/validation";
import { RATE_LIMITS } from "@/lib/auth/rate-limit";
import { authorize } from "@/lib/auth/guard";
import { enrollInTraining, listTrainingPrograms } from "@/lib/data/opportunities";
import { audit, pushNotification } from "@/lib/data/users";

/** Enrol the signed-in student in an open training programme. */
export async function POST(request: Request) {
  const blocked = await requireSameOrigin();
  if (blocked) return blocked;
  const limited = rateLimit(request, "training-enroll", RATE_LIMITS.mutation);
  if (limited) return limited;

  const auth = await authorize("student");
  if (!auth.ok) return fail(auth.message, auth.status);

  const parsed = await readJson(request, enrollTrainingSchema);
  if (!parsed.ok) return parsed.response;

  try {
    // enrollInTraining returns null for a programme that is missing or closed,
    // so a stale id from a cached page cannot enrol anyone.
    const enrollment = await enrollInTraining(auth.user.id, parsed.data.programId);
    if (!enrollment) return fail("That programme is no longer open.", 404);

    const program = (await listTrainingPrograms()).find((p) => p.id === parsed.data.programId);
    if (program) {
      await pushNotification({
        userId: program.postedByUserId,
        title: "New programme enrolment",
        body: `${auth.user.name} enrolled in ${program.title}.`,
        kind: "info",
        href: "/industry/training",
      });
    }

    await audit({ userId: auth.user.id, action: "training.enroll", outcome: "success", detail: parsed.data.programId });
    return ok({ enrollment }, { status: 201 });
  } catch (error) {
    return serverError("training enroll", error);
  }
}
