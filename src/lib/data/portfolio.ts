import "server-only";
import { mutate, newId, nowIso, read } from "./store";
import type {
  AcademicRecord, Achievement, Certification, PortfolioProject, Role, SecureDocument,
} from "@/lib/types";

export interface PortfolioBundle {
  certifications: Certification[];
  projects: PortfolioProject[];
  achievements: Achievement[];
  academicRecords: AcademicRecord[];
  documents: SecureDocument[];
}

export async function getPortfolio(userId: string): Promise<PortfolioBundle> {
  const db = await read();
  return {
    certifications: db.certifications.filter((c) => c.userId === userId),
    projects: db.projects.filter((p) => p.userId === userId),
    achievements: db.achievements.filter((a) => a.userId === userId),
    academicRecords: db.academicRecords.filter((r) => r.userId === userId),
    documents: db.documents.filter((d) => d.ownerId === userId),
  };
}

export async function addCertification(
  input: Omit<Certification, "id" | "verified" | "verifiedBy" | "verificationStatus" | "submittedAt">,
): Promise<Certification> {
  return mutate((db) => {
    const cert: Certification = {
      ...input,
      id: newId("cert"),
      verified: false,
      // A claim with evidence goes into the review queue; a bare claim does not,
      // because there would be nothing for a reviewer to look at.
      verificationStatus: input.documentId ? "pending" : "unverified",
      submittedAt: input.documentId ? nowIso() : undefined,
    };
    db.certifications.push(cert);
    return cert;
  });
}

/**
 * Attach evidence to a certification the student already added, moving it into
 * the review queue. Ownership is checked here rather than by the caller.
 */
export async function attachCertificationEvidence(
  certificationId: string,
  ownerId: string,
  documentId: string,
): Promise<Certification | null> {
  return mutate((db) => {
    const cert = db.certifications.find((c) => c.id === certificationId && c.userId === ownerId);
    if (!cert) return null;
    const document = db.documents.find((d) => d.id === documentId && d.ownerId === ownerId);
    if (!document) return null;
    cert.documentId = documentId;
    cert.verificationStatus = "pending";
    cert.submittedAt = nowIso();
    cert.reviewNote = undefined;
    return cert;
  });
}

export interface PendingCertification {
  certification: Certification;
  studentId: string;
  studentName: string;
}

/**
 * The review queue for one institution: certifications awaiting a verdict from
 * students enrolled at it. Scoping happens here so no caller can widen it.
 */
export async function listPendingCertifications(institutionId: string): Promise<PendingCertification[]> {
  const db = await read();
  const students = new Map(
    db.users.filter((u) => u.institutionId === institutionId).map((u) => [u.id, u.name]),
  );
  return db.certifications
    .filter((c) => c.verificationStatus === "pending" && students.has(c.userId))
    .map((certification) => ({
      certification,
      studentId: certification.userId,
      studentName: students.get(certification.userId) ?? "Student",
    }))
    .sort((a, b) => (b.certification.submittedAt ?? "").localeCompare(a.certification.submittedAt ?? ""));
}

/**
 * Record a verdict on a claim. The reviewer must belong to the institution the
 * student is enrolled at — a reviewer elsewhere gets null, not a silent no-op.
 */
export async function reviewCertification(input: {
  certificationId: string;
  reviewerId: string;
  reviewerInstitutionId: string;
  approve: boolean;
  note?: string;
}): Promise<Certification | null> {
  return mutate((db) => {
    const cert = db.certifications.find((c) => c.id === input.certificationId);
    if (!cert || cert.verificationStatus !== "pending") return null;
    const student = db.users.find((u) => u.id === cert.userId);
    if (!student || student.institutionId !== input.reviewerInstitutionId) return null;

    cert.verified = input.approve;
    cert.verificationStatus = input.approve ? "verified" : "rejected";
    cert.verifiedBy = input.approve ? input.reviewerInstitutionId : undefined;
    cert.reviewedAt = nowIso();
    cert.reviewNote = input.note;
    return cert;
  });
}

export async function addProject(input: Omit<PortfolioProject, "id" | "verified">): Promise<PortfolioProject> {
  return mutate((db) => {
    const project: PortfolioProject = { ...input, id: newId("proj"), verified: false };
    db.projects.push(project);
    return project;
  });
}

export async function addAchievement(input: Omit<Achievement, "id" | "verified">): Promise<Achievement> {
  return mutate((db) => {
    const achievement: Achievement = { ...input, id: newId("ach"), verified: false };
    db.achievements.push(achievement);
    return achievement;
  });
}

export async function registerDocument(input: Omit<SecureDocument, "id" | "uploadedAt" | "sharedWith">): Promise<SecureDocument> {
  return mutate((db) => {
    const doc: SecureDocument = { ...input, id: newId("doc"), uploadedAt: nowIso(), sharedWith: [] };
    db.documents.push(doc);
    return doc;
  });
}

/**
 * Authoritative check for whether a viewer may read a document.
 *
 * Owner always may. A recruiter may read a document only if the owner attached
 * it to an application for one of that recruiter's own postings. An institution
 * may read documents belonging to its own students. Nobody else may — and no
 * caller is allowed to skip this by loading the document directly.
 */
export async function canReadDocument(
  documentId: string,
  viewer: { id: string; role: Role; organizationId?: string; institutionId?: string },
): Promise<{ allowed: boolean; document?: SecureDocument; reason?: string }> {
  const db = await read();
  const document = db.documents.find((d) => d.id === documentId);
  if (!document) return { allowed: false, reason: "not_found" };

  if (document.ownerId === viewer.id) return { allowed: true, document };
  if (document.sharedWith.includes(viewer.id)) return { allowed: true, document };

  if (viewer.role === "industry" && viewer.organizationId) {
    const ownedOpportunities = new Set(
      db.opportunities.filter((o) => o.organizationId === viewer.organizationId).map((o) => o.id),
    );
    const attached = db.applications.some(
      (a) =>
        a.studentId === document.ownerId &&
        a.resumeDocumentId === document.id &&
        ownedOpportunities.has(a.opportunityId),
    );
    if (attached) return { allowed: true, document };
  }

  if (viewer.role === "institution" && viewer.institutionId) {
    const owner = db.users.find((u) => u.id === document.ownerId);
    if (owner?.institutionId === viewer.institutionId) {
      if (document.kind === "academic_record") return { allowed: true, document };
      // A certificate becomes readable only while it is the evidence behind a
      // claim this institution has been asked to verify — reviewing is the
      // grant, and it lapses once the claim leaves the queue.
      const underReview = db.certifications.some(
        (c) => c.userId === owner.id && c.documentId === document.id && c.verificationStatus === "pending",
      );
      if (document.kind === "certificate" && underReview) return { allowed: true, document };
    }
  }

  return { allowed: false, reason: "forbidden" };
}
