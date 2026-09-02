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

export async function addCertification(input: Omit<Certification, "id" | "verified" | "verifiedBy">): Promise<Certification> {
  return mutate((db) => {
    const cert: Certification = { ...input, id: newId("cert"), verified: false };
    db.certifications.push(cert);
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
    if (owner?.institutionId === viewer.institutionId && document.kind === "academic_record") {
      return { allowed: true, document };
    }
  }

  return { allowed: false, reason: "forbidden" };
}
