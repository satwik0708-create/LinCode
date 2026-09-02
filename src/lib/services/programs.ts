import "server-only";
import { listCollaborationPrograms, listProgramApplications } from "@/lib/data/opportunities";
import { read } from "@/lib/data/store";
import type { CollaborationKind, Role } from "@/lib/types";
import type { ProgramRow } from "@/components/programs/program-board";

export const KIND_LABEL: Record<CollaborationKind, string> = {
  faculty_internship: "Faculty internship",
  industrial_training: "Industrial training",
  fdp: "Faculty Development Programme",
  consultancy: "Consultancy",
  research: "Collaborative research",
  mentorship: "Mentorship",
  workshop: "Workshop",
  guest_lecture: "Guest lecture",
  innovation_challenge: "Innovation challenge",
  live_project: "Live project",
};

/**
 * Programme rows for one applicant.
 *
 * Listing is filtered by audience, so a caller only ever receives programmes
 * open to their own role — the same rule the apply endpoint enforces.
 */
export async function getProgramRows(
  userId: string,
  role: Role,
  kinds?: CollaborationKind[],
): Promise<ProgramRow[]> {
  const [programs, applications, db] = await Promise.all([
    listCollaborationPrograms({ audience: role, kinds }),
    listProgramApplications(userId),
    read(),
  ]);

  const names = new Map(db.organizations.map((o) => [o.id, o.name]));
  const applied = new Map(applications.map((a) => [a.programId, a.stage]));

  return programs.map((program) => ({
    id: program.id,
    kind: program.kind,
    kindLabel: KIND_LABEL[program.kind],
    title: program.title,
    description: program.description,
    organizationName: names.get(program.organizationId) ?? "Industry partner",
    mode: program.mode,
    location: program.location,
    startsOn: program.startsOn,
    durationWeeks: program.durationWeeks,
    seats: program.seats,
    stipend: program.stipend,
    focusAreas: program.focusAreas,
    deadline: program.deadline,
    applied: applied.has(program.id),
    appliedStage: applied.get(program.id),
  }));
}
