import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import type {
  Application, Assessment, AssessmentResult, Achievement, AcademicRecord, AuditEvent,
  Certification, CollaborationProgram, Enrollment, FacultyProfile, IndustryProfile,
  Institution, InstitutionProfile, LearningPath, LearningProgress, LearningStreak,
  Notification, Opportunity, Organization, PortfolioProject, ProgramApplication,
  SecureDocument, StreakActivity, StudentProfile, TrainingProgram, User,
} from "@/lib/types";

/**
 * JSON-file datastore for the MVP.
 *
 * Everything the app persists goes through `read()` / `mutate()`. That single
 * choke point is what makes the swap to Prisma/Postgres a contained change:
 * reimplement these two functions plus the collection accessors and no screen,
 * route handler or AI call site changes.
 *
 * `server-only` at the top guarantees a build error if any of this is ever
 * imported into a client component — none of this data may reach the browser
 * except through an authorised route handler.
 */

export interface Database {
  version: number;
  users: User[];
  institutions: Institution[];
  organizations: Organization[];
  studentProfiles: StudentProfile[];
  facultyProfiles: FacultyProfile[];
  industryProfiles: IndustryProfile[];
  institutionProfiles: InstitutionProfile[];
  assessments: Assessment[];
  assessmentResults: AssessmentResult[];
  learningPaths: LearningPath[];
  learningProgress: LearningProgress[];
  streaks: LearningStreak[];
  streakActivities: StreakActivity[];
  certifications: Certification[];
  projects: PortfolioProject[];
  achievements: Achievement[];
  academicRecords: AcademicRecord[];
  documents: SecureDocument[];
  opportunities: Opportunity[];
  applications: Application[];
  collaborationPrograms: CollaborationProgram[];
  programApplications: ProgramApplication[];
  trainingPrograms: TrainingProgram[];
  enrollments: Enrollment[];
  notifications: Notification[];
  auditLog: AuditEvent[];
}

export function emptyDatabase(): Database {
  return {
    version: 1,
    users: [], institutions: [], organizations: [],
    studentProfiles: [], facultyProfiles: [], industryProfiles: [], institutionProfiles: [],
    assessments: [], assessmentResults: [], learningPaths: [], learningProgress: [],
    streaks: [], streakActivities: [], certifications: [], projects: [], achievements: [],
    academicRecords: [], documents: [], opportunities: [], applications: [],
    collaborationPrograms: [], programApplications: [], trainingPrograms: [],
    enrollments: [], notifications: [], auditLog: [],
  };
}

const DATA_DIR = path.resolve(process.cwd(), process.env.DATA_DIR || ".data");
const DB_FILE = path.join(DATA_DIR, "db.json");

type Cache = {
  db: Database | null;
  loading: Promise<Database> | null;
  /** Serialises writes so concurrent requests cannot interleave read-modify-write. */
  queue: Promise<unknown>;
};

// Next.js reloads modules in dev; hang the cache off globalThis so the store
// survives hot reloads instead of resetting mid-session.
const globalStore = globalThis as unknown as { __lincodeStore?: Cache };
const cache: Cache = (globalStore.__lincodeStore ??= { db: null, loading: null, queue: Promise.resolve() });

async function loadFromDisk(): Promise<Database> {
  try {
    const raw = await fs.readFile(DB_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<Database>;
    // Merge onto an empty DB so a file written by an older version still boots.
    return { ...emptyDatabase(), ...parsed, version: 1 };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
    const { buildSeedDatabase } = await import("./seed");
    const seeded = await buildSeedDatabase();
    await persist(seeded);
    return seeded;
  }
}

async function persist(db: Database): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true, mode: 0o700 });
  const tmp = `${DB_FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), { mode: 0o600 });
  await fs.rename(tmp, DB_FILE);
}

/** Read-only snapshot. Callers must not mutate the result — use `mutate` for that. */
export async function read(): Promise<Database> {
  if (cache.db) return cache.db;
  cache.loading ??= loadFromDisk().then((db) => {
    cache.db = db;
    cache.loading = null;
    return db;
  });
  return cache.loading;
}

/**
 * Apply a mutation and flush to disk. Mutations are queued, so a burst of
 * concurrent requests can't clobber each other's writes.
 */
export async function mutate<T>(fn: (db: Database) => T | Promise<T>): Promise<T> {
  const run = cache.queue.then(async () => {
    const db = await read();
    const result = await fn(db);
    await persist(db);
    return result;
  });
  // Keep the chain alive even if this mutation throws.
  cache.queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

/** Test/dev helper: drop the in-memory cache, the file, and any uploads it referenced. */
export async function resetStore(): Promise<void> {
  cache.db = null;
  cache.loading = null;
  await fs.rm(DB_FILE, { force: true });
  const { clearUploads } = await import("./uploads");
  await clearUploads();
}

export function newId(prefix: string): string {
  // crypto.randomUUID is available in Node 19+ and the edge runtime.
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
