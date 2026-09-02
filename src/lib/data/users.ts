import "server-only";
import { mutate, newId, nowIso, read } from "./store";
import type {
  AuditEvent, FacultyProfile, IndustryProfile, InstitutionProfile,
  Institution, Notification, PublicUser, Role, StudentProfile, User,
} from "@/lib/types";

/** Strip everything that must never cross the network boundary. */
export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    mobile: user.mobile,
    roles: user.roles,
    activeRole: user.activeRole,
    onboardingComplete: user.onboardingComplete,
    institutionId: user.institutionId,
    organizationId: user.organizationId,
  };
}

export async function findUserById(id: string): Promise<User | undefined> {
  const db = await read();
  return db.users.find((u) => u.id === id);
}

export async function findUserByEmail(email: string): Promise<User | undefined> {
  const db = await read();
  const needle = email.trim().toLowerCase();
  return db.users.find((u) => u.email.toLowerCase() === needle);
}

export async function findUserByMobile(mobile: string): Promise<User | undefined> {
  const db = await read();
  return db.users.find((u) => u.mobile === mobile);
}

export interface CreateUserInput {
  name: string;
  email?: string;
  mobile?: string;
  passwordHash: string;
}

export async function createUser(input: CreateUserInput): Promise<User> {
  return mutate((db) => {
    const now = nowIso();
    const user: User = {
      id: newId("usr"),
      name: input.name,
      // A placeholder address keeps `email` non-optional for lookups when a user
      // registers by mobile only; it is never treated as verified or contactable.
      email: input.email ?? `${newId("m")}@mobile.local`,
      mobile: input.mobile,
      passwordHash: input.passwordHash,
      roles: [],
      activeRole: null,
      emailVerified: false,
      mobileVerified: false,
      onboardingComplete: false,
      createdAt: now,
      updatedAt: now,
      failedLoginCount: 0,
    };
    db.users.push(user);
    return user;
  });
}

export async function updateUser(id: string, patch: Partial<User>): Promise<User | undefined> {
  return mutate((db) => {
    const user = db.users.find((u) => u.id === id);
    if (!user) return undefined;
    Object.assign(user, patch, { updatedAt: nowIso() });
    return user;
  });
}

/** Grant a role and make it active. Existing grants are preserved. */
export async function assignRole(userId: string, role: Role): Promise<User | undefined> {
  return mutate((db) => {
    const user = db.users.find((u) => u.id === userId);
    if (!user) return undefined;
    if (!user.roles.includes(role)) user.roles.push(role);
    user.activeRole = role;
    user.updatedAt = nowIso();
    return user;
  });
}

const LOCK_THRESHOLD = 5;
const LOCK_MINUTES = 15;

export async function recordFailedLogin(userId: string): Promise<void> {
  await mutate((db) => {
    const user = db.users.find((u) => u.id === userId);
    if (!user) return;
    user.failedLoginCount += 1;
    if (user.failedLoginCount >= LOCK_THRESHOLD) {
      user.lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60_000).toISOString();
    }
    user.updatedAt = nowIso();
  });
}

export async function recordSuccessfulLogin(userId: string): Promise<void> {
  await mutate((db) => {
    const user = db.users.find((u) => u.id === userId);
    if (!user) return;
    user.failedLoginCount = 0;
    user.lockedUntil = undefined;
    user.lastLoginAt = nowIso();
    user.updatedAt = nowIso();
  });
}

export function isLocked(user: User): boolean {
  return !!user.lockedUntil && new Date(user.lockedUntil).getTime() > Date.now();
}

/* ---------------- Profiles ---------------- */

export async function getStudentProfile(userId: string): Promise<StudentProfile | undefined> {
  const db = await read();
  return db.studentProfiles.find((p) => p.userId === userId);
}

export async function upsertStudentProfile(
  userId: string,
  patch: Partial<StudentProfile>,
): Promise<StudentProfile> {
  return mutate((db) => {
    let profile = db.studentProfiles.find((p) => p.userId === userId);
    if (!profile) {
      profile = {
        userId, institutionName: "", degree: "", branch: "",
        graduationYear: new Date().getFullYear() + 1,
        careerInterests: [], enrollments: [], skillMatrix: {}, updatedAt: nowIso(),
      };
      db.studentProfiles.push(profile);
    }
    Object.assign(profile, patch, { userId, updatedAt: nowIso() });
    return profile;
  });
}

export async function getFacultyProfile(userId: string): Promise<FacultyProfile | undefined> {
  const db = await read();
  return db.facultyProfiles.find((p) => p.userId === userId);
}

export async function upsertFacultyProfile(userId: string, patch: Partial<FacultyProfile>): Promise<FacultyProfile> {
  return mutate((db) => {
    let profile = db.facultyProfiles.find((p) => p.userId === userId);
    if (!profile) {
      profile = { userId, institutionName: "", department: "", designation: "", yearsOfExperience: 0, researchAreas: [], expertise: [], updatedAt: nowIso() };
      db.facultyProfiles.push(profile);
    }
    Object.assign(profile, patch, { userId, updatedAt: nowIso() });
    return profile;
  });
}

export async function getIndustryProfile(userId: string): Promise<IndustryProfile | undefined> {
  const db = await read();
  return db.industryProfiles.find((p) => p.userId === userId);
}

export async function upsertIndustryProfile(userId: string, patch: Partial<IndustryProfile>): Promise<IndustryProfile> {
  return mutate((db) => {
    let profile = db.industryProfiles.find((p) => p.userId === userId);
    if (!profile) {
      profile = { userId, organizationId: "", companyName: "", designation: "", industrySector: "", companySize: "", hiringFor: [], updatedAt: nowIso() };
      db.industryProfiles.push(profile);
    }
    Object.assign(profile, patch, { userId, updatedAt: nowIso() });
    return profile;
  });
}

export async function getInstitutionProfile(userId: string): Promise<InstitutionProfile | undefined> {
  const db = await read();
  return db.institutionProfiles.find((p) => p.userId === userId);
}

export async function upsertInstitutionProfile(userId: string, patch: Partial<InstitutionProfile>): Promise<InstitutionProfile> {
  return mutate((db) => {
    let profile = db.institutionProfiles.find((p) => p.userId === userId);
    if (!profile) {
      profile = { userId, institutionId: "", designation: "", updatedAt: nowIso() };
      db.institutionProfiles.push(profile);
    }
    Object.assign(profile, patch, { userId, updatedAt: nowIso() });
    return profile;
  });
}

/**
 * Create or update the institution an institutional user registered.
 *
 * Registration carries the institution's own identity — type, website, address,
 * accreditation — which a record inferred from a student profile never has.
 */
export async function registerInstitution(input: {
  name: string;
  type: Institution["type"];
  website?: string;
  officialEmail?: string;
  address?: string;
  city: string;
  state: string;
  accreditation?: string;
}): Promise<string> {
  return mutate((db) => {
    const needle = input.name.trim().toLowerCase();
    const existing = db.institutions.find((i) => i.name.toLowerCase() === needle);
    if (existing) {
      Object.assign(existing, {
        type: input.type,
        website: input.website || existing.website,
        officialEmail: input.officialEmail || existing.officialEmail,
        address: input.address || existing.address,
        city: input.city || existing.city,
        state: input.state || existing.state,
        accreditation: input.accreditation || existing.accreditation,
      });
      return existing.id;
    }
    const id = newId("inst");
    db.institutions.push({
      id,
      name: input.name.trim(),
      type: input.type,
      city: input.city,
      state: input.state,
      departments: [],
      studentCount: 0,
      website: input.website || undefined,
      officialEmail: input.officialEmail || undefined,
      address: input.address || undefined,
      accreditation: input.accreditation || undefined,
      createdAt: nowIso(),
    });
    return id;
  });
}

export async function findOrCreateInstitutionByName(name: string): Promise<string> {
  return mutate((db) => {
    const needle = name.trim().toLowerCase();
    const existing = db.institutions.find((i) => i.name.toLowerCase() === needle);
    if (existing) return existing.id;
    const id = newId("inst");
    db.institutions.push({
      id, name: name.trim(), type: "college", city: "", state: "",
      departments: [], studentCount: 0, createdAt: nowIso(),
    });
    return id;
  });
}

export async function findOrCreateOrganizationByName(name: string, sector: string, size: string): Promise<string> {
  return mutate((db) => {
    const needle = name.trim().toLowerCase();
    const existing = db.organizations.find((o) => o.name.toLowerCase() === needle);
    if (existing) return existing.id;
    const id = newId("org");
    db.organizations.push({ id, name: name.trim(), sector, size, city: "", createdAt: nowIso() });
    return id;
  });
}

export async function getOrganization(id: string) {
  const db = await read();
  return db.organizations.find((o) => o.id === id);
}

export async function getInstitution(id: string) {
  const db = await read();
  return db.institutions.find((i) => i.id === id);
}

export async function listInstitutions() {
  const db = await read();
  return db.institutions;
}

/* ---------------- Notifications ---------------- */

export async function listNotifications(userId: string): Promise<Notification[]> {
  const db = await read();
  return db.notifications
    .filter((n) => n.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function pushNotification(n: Omit<Notification, "id" | "createdAt" | "read">): Promise<void> {
  await mutate((db) => {
    db.notifications.push({ ...n, id: newId("ntf"), read: false, createdAt: nowIso() });
  });
}

export async function markNotificationsRead(userId: string): Promise<void> {
  await mutate((db) => {
    for (const n of db.notifications) if (n.userId === userId) n.read = true;
  });
}

/* ---------------- Audit ---------------- */

export async function audit(event: Omit<AuditEvent, "id" | "createdAt">): Promise<void> {
  await mutate((db) => {
    db.auditLog.push({ ...event, id: newId("aud"), createdAt: nowIso() });
    // Bound the log so the JSON file cannot grow without limit in the MVP.
    if (db.auditLog.length > 2000) db.auditLog.splice(0, db.auditLog.length - 2000);
  });
}

export async function recentAudit(limit = 50): Promise<AuditEvent[]> {
  const db = await read();
  return db.auditLog.slice(-limit).reverse();
}
