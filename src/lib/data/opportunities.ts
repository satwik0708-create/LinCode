import "server-only";
import { mutate, newId, nowIso, read } from "./store";
import type {
  Application, ApplicationStage, CollaborationProgram, Enrollment,
  Opportunity, ProgramApplication, Role, TrainingProgram,
} from "@/lib/types";

/* ---------------- Opportunities ---------------- */

export async function listOpportunities(filter?: {
  types?: Opportunity["type"][];
  domainIds?: string[];
  organizationId?: string;
  includeClosed?: boolean;
}): Promise<Opportunity[]> {
  const db = await read();
  return db.opportunities
    .filter((o) => (filter?.includeClosed ? true : o.status === "open"))
    .filter((o) => (filter?.types ? filter.types.includes(o.type) : true))
    .filter((o) => (filter?.organizationId ? o.organizationId === filter.organizationId : true))
    .filter((o) => (filter?.domainIds?.length ? o.domainIds.some((d) => filter.domainIds!.includes(d)) : true))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getOpportunity(id: string): Promise<Opportunity | undefined> {
  const db = await read();
  return db.opportunities.find((o) => o.id === id);
}

export async function createOpportunity(input: Omit<Opportunity, "id" | "createdAt">): Promise<Opportunity> {
  return mutate((db) => {
    const opportunity: Opportunity = { ...input, id: newId("opp"), createdAt: nowIso() };
    db.opportunities.push(opportunity);
    return opportunity;
  });
}

export async function setOpportunityStatus(
  id: string,
  organizationId: string,
  status: Opportunity["status"],
): Promise<boolean> {
  return mutate((db) => {
    const opportunity = db.opportunities.find((o) => o.id === id);
    // Ownership is re-checked here, not just at the route, so no caller can
    // close another employer's posting.
    if (!opportunity || opportunity.organizationId !== organizationId) return false;
    opportunity.status = status;
    return true;
  });
}

/* ---------------- Applications ---------------- */

export async function listApplicationsForStudent(studentId: string): Promise<Application[]> {
  const db = await read();
  return db.applications
    .filter((a) => a.studentId === studentId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function listApplicationsForOrganization(organizationId: string): Promise<Application[]> {
  const db = await read();
  const owned = new Set(
    db.opportunities.filter((o) => o.organizationId === organizationId).map((o) => o.id),
  );
  return db.applications
    .filter((a) => owned.has(a.opportunityId))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function listApplicationsForInstitution(institutionId: string): Promise<Application[]> {
  const db = await read();
  const students = new Set(
    db.users.filter((u) => u.institutionId === institutionId && u.roles.includes("student")).map((u) => u.id),
  );
  return db.applications.filter((a) => students.has(a.studentId));
}

export async function hasApplied(studentId: string, opportunityId: string): Promise<boolean> {
  const db = await read();
  return db.applications.some((a) => a.studentId === studentId && a.opportunityId === opportunityId);
}

export async function createApplication(input: {
  opportunityId: string;
  studentId: string;
  matchScore: number;
  coverNote?: string;
  resumeDocumentId?: string;
}): Promise<Application> {
  return mutate((db) => {
    const now = nowIso();
    const application: Application = {
      id: newId("app"),
      opportunityId: input.opportunityId,
      studentId: input.studentId,
      stage: "applied",
      matchScore: input.matchScore,
      coverNote: input.coverNote,
      resumeDocumentId: input.resumeDocumentId,
      timeline: [{ stage: "applied", at: now, actorId: input.studentId }],
      createdAt: now,
      updatedAt: now,
    };
    db.applications.push(application);
    return application;
  });
}

export async function getApplication(id: string): Promise<Application | undefined> {
  const db = await read();
  return db.applications.find((a) => a.id === id);
}

/** Advance an application. `actorOrganizationId` is verified against the posting. */
export async function advanceApplication(
  applicationId: string,
  stage: ApplicationStage,
  actorId: string,
  actorOrganizationId: string,
  note?: string,
): Promise<Application | undefined> {
  return mutate((db) => {
    const application = db.applications.find((a) => a.id === applicationId);
    if (!application) return undefined;
    const opportunity = db.opportunities.find((o) => o.id === application.opportunityId);
    if (!opportunity || opportunity.organizationId !== actorOrganizationId) return undefined;

    application.stage = stage;
    application.timeline.push({ stage, at: nowIso(), actorId, note });
    application.updatedAt = nowIso();
    return application;
  });
}

export async function withdrawApplication(applicationId: string, studentId: string): Promise<boolean> {
  return mutate((db) => {
    const application = db.applications.find((a) => a.id === applicationId);
    if (!application || application.studentId !== studentId) return false;
    if (application.stage === "selected") return false;
    application.stage = "withdrawn";
    application.timeline.push({ stage: "withdrawn", at: nowIso(), actorId: studentId });
    application.updatedAt = nowIso();
    return true;
  });
}

/* ---------------- Collaboration programs ---------------- */

export async function listCollaborationPrograms(filter?: {
  audience?: Role;
  kinds?: CollaborationProgram["kind"][];
  organizationId?: string;
}): Promise<CollaborationProgram[]> {
  const db = await read();
  return db.collaborationPrograms
    .filter((p) => (filter?.audience ? p.audience.includes(filter.audience) : true))
    .filter((p) => (filter?.kinds ? filter.kinds.includes(p.kind) : true))
    .filter((p) => (filter?.organizationId ? p.organizationId === filter.organizationId : true))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getCollaborationProgram(id: string): Promise<CollaborationProgram | undefined> {
  const db = await read();
  return db.collaborationPrograms.find((p) => p.id === id);
}

export async function createCollaborationProgram(
  input: Omit<CollaborationProgram, "id" | "createdAt">,
): Promise<CollaborationProgram> {
  return mutate((db) => {
    const program: CollaborationProgram = { ...input, id: newId("col"), createdAt: nowIso() };
    db.collaborationPrograms.push(program);
    return program;
  });
}

export async function listProgramApplications(applicantId: string): Promise<ProgramApplication[]> {
  const db = await read();
  return db.programApplications
    .filter((p) => p.applicantId === applicantId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function listProgramApplicationsForOrganization(organizationId: string): Promise<ProgramApplication[]> {
  const db = await read();
  const owned = new Set(
    db.collaborationPrograms.filter((p) => p.organizationId === organizationId).map((p) => p.id),
  );
  return db.programApplications.filter((a) => owned.has(a.programId));
}

export async function applyToProgram(input: {
  programId: string;
  applicantId: string;
  applicantRole: Role;
  note?: string;
}): Promise<ProgramApplication | { error: "duplicate" | "not_found" | "forbidden" }> {
  return mutate((db) => {
    const program = db.collaborationPrograms.find((p) => p.id === input.programId);
    if (!program || program.status !== "open") return { error: "not_found" as const };
    // The audience list is the authorisation boundary — a student cannot apply
    // to a faculty-only FDP by guessing its id.
    if (!program.audience.includes(input.applicantRole)) return { error: "forbidden" as const };
    if (db.programApplications.some((a) => a.programId === input.programId && a.applicantId === input.applicantId)) {
      return { error: "duplicate" as const };
    }
    const now = nowIso();
    const application: ProgramApplication = {
      id: newId("papp"),
      programId: input.programId,
      applicantId: input.applicantId,
      applicantRole: input.applicantRole,
      stage: "applied",
      note: input.note,
      timeline: [{ stage: "applied", at: now, actorId: input.applicantId }],
      createdAt: now,
      updatedAt: now,
    };
    db.programApplications.push(application);
    return application;
  });
}

/* ---------------- Training programs ---------------- */

export async function listTrainingPrograms(filter?: {
  domainIds?: string[];
  organizationId?: string;
}): Promise<TrainingProgram[]> {
  const db = await read();
  return db.trainingPrograms
    .filter((t) => (filter?.organizationId ? t.organizationId === filter.organizationId : true))
    .filter((t) => (filter?.domainIds?.length ? t.domainIds.some((d) => filter.domainIds!.includes(d)) : true))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createTrainingProgram(
  input: Omit<TrainingProgram, "id" | "createdAt">,
): Promise<TrainingProgram> {
  return mutate((db) => {
    const program: TrainingProgram = { ...input, id: newId("trn"), createdAt: nowIso() };
    db.trainingPrograms.push(program);
    return program;
  });
}

export async function listEnrollments(userId: string): Promise<Enrollment[]> {
  const db = await read();
  return db.enrollments.filter((e) => e.userId === userId);
}

export async function enrollInTraining(userId: string, programId: string): Promise<Enrollment | null> {
  return mutate((db) => {
    const program = db.trainingPrograms.find((t) => t.id === programId && t.status === "open");
    if (!program) return null;
    const existing = db.enrollments.find((e) => e.userId === userId && e.programId === programId);
    if (existing) return existing;
    const enrollment: Enrollment = {
      id: newId("enr"), programId, userId, progress: 0, status: "enrolled", createdAt: nowIso(),
    };
    db.enrollments.push(enrollment);
    return enrollment;
  });
}
