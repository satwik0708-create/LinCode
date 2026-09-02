/**
 * LinCode domain model.
 *
 * These types are the contract between the data layer, the AI engine and the UI.
 * The MVP persists them through a JSON-backed repository (src/lib/data/store.ts);
 * swapping in Prisma/Postgres later means reimplementing the repository, not
 * touching the types or the screens that consume them.
 */

export type Role = "student" | "faculty" | "industry" | "institution" | "admin";

export const ROLES: Role[] = ["student", "faculty", "industry", "institution", "admin"];

/** Roles a user may self-select at registration. `admin` is provisioned, never chosen. */
export const SELECTABLE_ROLES: Exclude<Role, "admin">[] = ["student", "faculty", "industry", "institution"];

export type LearningLevel = "beginner" | "intermediate" | "advanced";

export type SkillStrength = "strong" | "developing" | "weak" | "unknown";

export type ApplicationStage =
  | "applied"
  | "under_review"
  | "shortlisted"
  | "interview"
  | "selected"
  | "rejected"
  | "withdrawn";

export type OpportunityType = "internship" | "job" | "project" | "apprenticeship" | "training";

/* ------------------------------------------------------------------ */
/* Identity                                                            */
/* ------------------------------------------------------------------ */

export interface User {
  id: string;
  email: string;
  /** E.164-ish, normalised at write time. Optional: users may register with either channel. */
  mobile?: string;
  name: string;
  /** scrypt hash — never leaves the server, never serialised into a response. */
  passwordHash: string;
  /** Roles this account is authorised for. Access control reads only this. */
  roles: Role[];
  /** The role the user is currently operating as; must be a member of `roles`. */
  activeRole: Role | null;
  emailVerified: boolean;
  mobileVerified: boolean;
  onboardingComplete: boolean;
  /** Institution the account belongs to, when applicable. */
  institutionId?: string;
  /** Employer the account belongs to, for industry users. */
  organizationId?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  /** Consecutive failed logins; drives progressive lockout. */
  failedLoginCount: number;
  lockedUntil?: string;
}

/** The safe projection of a user that may cross the network boundary. */
export interface PublicUser {
  id: string;
  name: string;
  email: string;
  mobile?: string;
  roles: Role[];
  activeRole: Role | null;
  onboardingComplete: boolean;
  institutionId?: string;
  organizationId?: string;
}

/* ------------------------------------------------------------------ */
/* Profiles                                                            */
/* ------------------------------------------------------------------ */

export interface StudentProfile {
  userId: string;
  institutionId?: string;
  institutionName: string;
  degree: string;
  branch: string;
  graduationYear: number;
  cgpa?: number;
  currentSemester?: number;
  location?: string;
  headline?: string;
  about?: string;
  careerInterests: string[];
  /** Domains the student is enrolled in — many at once, by design. */
  enrollments: DomainEnrollment[];
  /** Verified + self-reported skill levels, keyed by skill id. */
  skillMatrix: Record<string, SkillSignal>;
  updatedAt: string;
}

export interface SkillSignal {
  skillId: string;
  /** 0-100 competency estimate. */
  score: number;
  strength: SkillStrength;
  /** Where the signal came from — assessments outrank self-reports. */
  source: "assessment" | "module" | "self" | "verified";
  verified: boolean;
  updatedAt: string;
}

export interface DomainEnrollment {
  domainId: string;
  /** What the student claimed at onboarding. */
  declaredLevel: LearningLevel;
  /** What the diagnostic actually placed them at. */
  placedLevel: LearningLevel | null;
  placementScore: number | null;
  status: "not_started" | "in_progress" | "completed";
  /** 0-100, derived from completed modules in the personalised path. */
  progress: number;
  enrolledAt: string;
  completedAt?: string;
}

export interface FacultyProfile {
  userId: string;
  institutionId?: string;
  institutionName: string;
  /** ISO date. Optional so profiles created before this field stay valid. */
  dateOfBirth?: string;
  department: string;
  designation: string;
  yearsOfExperience: number;
  researchAreas: string[];
  expertise: string[];
  publications?: number;
  updatedAt: string;
}

export interface IndustryProfile {
  userId: string;
  organizationId: string;
  companyName: string;
  designation: string;
  industrySector: string;
  companySize: string;
  website?: string;
  hiringFor: string[];
  updatedAt: string;
}

/** The person acting for an institution, distinct from the institution itself. */
export interface InstitutionProfile {
  userId: string;
  institutionId: string;
  designation: string;
  department?: string;
  officialEmail?: string;
  mobile?: string;
  /** Why they are here — placement drives, analytics, industry outreach. */
  purpose?: string;
  updatedAt: string;
}

export type InstitutionType = "university" | "college" | "polytechnic" | "iti" | "autonomous" | "deemed";

export interface Institution {
  id: string;
  name: string;
  type: InstitutionType;
  city: string;
  state: string;
  departments: string[];
  studentCount: number;
  /** Captured when an institution registers itself, blank for ones inferred
   *  from a student or faculty profile. */
  website?: string;
  officialEmail?: string;
  address?: string;
  /** e.g. "NAAC A++", "NBA accredited", "Affiliated to SPPU". */
  accreditation?: string;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  sector: string;
  size: string;
  city: string;
  website?: string;
  about?: string;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/* Skills & learning catalogue                                         */
/* ------------------------------------------------------------------ */

export interface Skill {
  id: string;
  name: string;
  category: "technical" | "soft" | "tool" | "domain";
  /** Domains this skill contributes to. */
  domainIds: string[];
  description: string;
}

/** How much of a skill a role/opportunity expects. */
export interface SkillRequirement {
  skillId: string;
  /** Minimum competency, 0-100. */
  minimumScore: number;
  weight: number;
  mandatory: boolean;
}

export interface LearningDomain {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  gradient: string;
  /** Ordered skill ids that define the competency map for this domain. */
  skillIds: string[];
  estimatedWeeks: number;
  industryDemand: number;
  averageSalaryLpa: number;
  roles: string[];
}

export interface Course {
  id: string;
  domainId: string;
  title: string;
  level: LearningLevel;
  summary: string;
  moduleIds: string[];
}

export interface LearningModule {
  id: string;
  domainId: string;
  courseId: string;
  title: string;
  summary: string;
  level: LearningLevel;
  order: number;
  estimatedMinutes: number;
  /** Skills this module builds — used to skip content a student already knows. */
  skillIds: string[];
  prerequisiteModuleIds: string[];
  resources: LearningResource[];
}

export interface LearningResource {
  id: string;
  title: string;
  type: "video" | "article" | "docs" | "lab" | "quiz" | "project";
  provider: string;
  url: string;
  minutes: number;
}

/* ------------------------------------------------------------------ */
/* Assessment                                                          */
/* ------------------------------------------------------------------ */

export interface AssessmentQuestion {
  id: string;
  domainId: string;
  skillId: string;
  level: LearningLevel;
  prompt: string;
  options: string[];
  /** Server-side only. Stripped before questions are sent to the client. */
  correctIndex: number;
  explanation: string;
}

/** A question as the browser receives it — no answer key. */
export type ClientQuestion = Omit<AssessmentQuestion, "correctIndex" | "explanation">;

export interface Assessment {
  id: string;
  userId: string;
  domainId: string;
  kind: "placement" | "practice" | "soft_skills" | "module";
  declaredLevel: LearningLevel;
  /** Set for a module checkpoint quiz — the subtopic it follows. */
  moduleId?: string;
  questionIds: string[];
  createdAt: string;
  expiresAt: string;
  submittedAt?: string;
}

export interface AssessmentResult {
  id: string;
  assessmentId: string;
  userId: string;
  domainId: string;
  scorePercent: number;
  correctCount: number;
  totalCount: number;
  declaredLevel: LearningLevel;
  placedLevel: LearningLevel;
  /** Per-skill breakdown, 0-100. */
  skillScores: Record<string, number>;
  /** Set when the result came from a module checkpoint rather than a diagnostic. */
  moduleId?: string;
  createdAt: string;
}

/**
 * What a student sees after a module checkpoint.
 *
 * The answer key is included deliberately — it is only ever built *after* the
 * submission is graded and stored, so revealing it cannot change the score, and
 * a checkpoint you cannot learn from is a waste of the student's time.
 */
export interface QuizReviewItem {
  questionId: string;
  prompt: string;
  options: string[];
  skillId: string;
  skillName: string;
  chosenIndex: number | null;
  correctIndex: number;
  correct: boolean;
  explanation: string;
}

export interface ModuleQuizGap {
  skillId: string;
  skillName: string;
  /** Score on this checkpoint, 0-100. */
  score: number;
  /** What the market expects for this skill in the domain, 0-100. */
  requiredScore: number;
  missedCount: number;
  totalCount: number;
  /** Modules in this domain that teach the skill, for a concrete next step. */
  revisit: Array<{ moduleId: string; title: string }>;
}

export interface ModuleQuizReport {
  resultId: string;
  moduleId: string;
  moduleTitle: string;
  domainId: string;
  domainName: string;
  scorePercent: number;
  correctCount: number;
  totalCount: number;
  passed: boolean;
  summary: string;
  gaps: ModuleQuizGap[];
  strengths: Array<{ skillId: string; skillName: string; score: number }>;
  review: QuizReviewItem[];
}

export interface SkillGapEntry {
  skillId: string;
  skillName: string;
  currentScore: number;
  requiredScore: number;
  gap: number;
  strength: SkillStrength;
}

export interface SkillGapReport {
  userId: string;
  domainId: string;
  generatedAt: string;
  strong: SkillGapEntry[];
  developing: SkillGapEntry[];
  needsImprovement: SkillGapEntry[];
  missing: SkillGapEntry[];
  readinessScore: number;
  summary: string;
}

/* ------------------------------------------------------------------ */
/* Learning progress                                                   */
/* ------------------------------------------------------------------ */

export interface LearningPathStep {
  moduleId: string;
  order: number;
  status: "skip" | "recommended" | "locked";
  /** Why the AI engine placed (or skipped) this step — shown to the student. */
  rationale: string;
}

export interface LearningPath {
  id: string;
  userId: string;
  domainId: string;
  level: LearningLevel;
  steps: LearningPathStep[];
  generatedAt: string;
}

export interface LearningProgress {
  id: string;
  userId: string;
  domainId: string;
  moduleId: string;
  status: "not_started" | "in_progress" | "completed";
  percent: number;
  startedAt?: string;
  completedAt?: string;
  updatedAt: string;
}

export type StreakActivityType =
  | "module_completed"
  | "lesson_completed"
  | "quiz_completed"
  | "assessment_completed"
  | "project_submitted";

export interface StreakActivity {
  id: string;
  userId: string;
  type: StreakActivityType;
  /** YYYY-MM-DD in the user's reporting timezone. */
  day: string;
  domainId?: string;
  moduleId?: string;
  minutes: number;
  createdAt: string;
}

export interface LearningStreak {
  userId: string;
  current: number;
  longest: number;
  lastActiveDay: string | null;
  /** Day -> number of qualifying activities, for the calendar heatmap. */
  history: Record<string, number>;
  updatedAt: string;
}

/* ------------------------------------------------------------------ */
/* Portfolio                                                           */
/* ------------------------------------------------------------------ */

/**
 * `verified` is the claim's outcome; `verificationStatus` is where it is in the
 * review. A certificate with no evidence attached stays "unverified" — nobody
 * is asked to rubber-stamp a bare assertion.
 */
export type VerificationStatus = "unverified" | "pending" | "verified" | "rejected";

export interface Certification {
  id: string;
  userId: string;
  name: string;
  issuer: string;
  issuedOn: string;
  credentialId?: string;
  credentialUrl?: string;
  skillIds: string[];
  verified: boolean;
  verifiedBy?: string;
  verificationStatus: VerificationStatus;
  /** Uploaded certificate backing the claim, read only through the documents route. */
  documentId?: string;
  submittedAt?: string;
  reviewedAt?: string;
  /** Reviewer's note, shown to the student — the reason a claim was rejected. */
  reviewNote?: string;
}

export interface PortfolioProject {
  id: string;
  userId: string;
  title: string;
  description: string;
  repoUrl?: string;
  liveUrl?: string;
  skillIds: string[];
  highlights: string[];
  completedOn: string;
  verified: boolean;
}

export interface Achievement {
  id: string;
  userId: string;
  title: string;
  description: string;
  awardedBy: string;
  awardedOn: string;
  verified: boolean;
}

export interface AcademicRecord {
  id: string;
  userId: string;
  term: string;
  gpa: number;
  credits: number;
  highlights: string[];
  /** Records pushed by the institution are authoritative. */
  verifiedByInstitution: boolean;
}

export interface SecureDocument {
  id: string;
  ownerId: string;
  kind: "resume" | "certificate" | "internship_report" | "academic_record" | "offer_letter";
  filename: string;
  mimeType: string;
  sizeBytes: number;
  /** Opaque storage key. Documents are only ever served through an authorised route. */
  storageKey: string;
  uploadedAt: string;
  /** User ids explicitly granted read access beyond the owner. */
  sharedWith: string[];
}

/* ------------------------------------------------------------------ */
/* Opportunities                                                       */
/* ------------------------------------------------------------------ */

export interface Opportunity {
  id: string;
  type: OpportunityType;
  organizationId: string;
  postedByUserId: string;
  title: string;
  description: string;
  location: string;
  workMode: "onsite" | "remote" | "hybrid";
  stipend?: string;
  salaryLpa?: string;
  durationMonths?: number;
  domainIds: string[];
  requirements: SkillRequirement[];
  eligibility: {
    degrees: string[];
    branches: string[];
    graduationYears: number[];
    minCgpa?: number;
  };
  openings: number;
  deadline: string;
  status: "draft" | "open" | "closed";
  createdAt: string;
}

export interface Application {
  id: string;
  opportunityId: string;
  studentId: string;
  stage: ApplicationStage;
  matchScore: number;
  coverNote?: string;
  resumeDocumentId?: string;
  timeline: ApplicationEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationEvent {
  stage: ApplicationStage;
  at: string;
  note?: string;
  /** Who moved it — recruiter id, or "system". */
  actorId: string;
}

/* ------------------------------------------------------------------ */
/* Industry <-> academia collaboration                                 */
/* ------------------------------------------------------------------ */

export type CollaborationKind =
  | "faculty_internship"
  | "industrial_training"
  | "fdp"
  | "consultancy"
  | "research"
  | "mentorship"
  | "workshop"
  | "guest_lecture"
  | "innovation_challenge"
  | "live_project";

export interface CollaborationProgram {
  id: string;
  kind: CollaborationKind;
  organizationId: string;
  postedByUserId: string;
  title: string;
  description: string;
  /** Which roles may see and apply to this program. */
  audience: Role[];
  mode: "onsite" | "remote" | "hybrid";
  location: string;
  startsOn: string;
  durationWeeks: number;
  seats: number;
  stipend?: string;
  focusAreas: string[];
  deadline: string;
  status: "open" | "closed";
  createdAt: string;
}

export interface ProgramApplication {
  id: string;
  programId: string;
  applicantId: string;
  applicantRole: Role;
  stage: ApplicationStage;
  note?: string;
  timeline: ApplicationEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface TrainingProgram {
  id: string;
  organizationId: string;
  postedByUserId: string;
  title: string;
  description: string;
  kind: "training" | "certification" | "workshop" | "mentorship";
  domainIds: string[];
  skillIds: string[];
  level: LearningLevel;
  durationWeeks: number;
  mode: "self_paced" | "cohort" | "live";
  certificateOffered: boolean;
  seats: number;
  startsOn: string;
  status: "open" | "closed";
  createdAt: string;
}

export interface Enrollment {
  id: string;
  programId: string;
  userId: string;
  progress: number;
  status: "enrolled" | "completed" | "dropped";
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/* Notifications & audit                                               */
/* ------------------------------------------------------------------ */

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  kind: "info" | "success" | "warning" | "action";
  href?: string;
  read: boolean;
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  /** Null for anonymous events such as failed logins on unknown accounts. */
  userId: string | null;
  action: string;
  outcome: "success" | "failure" | "denied";
  ip?: string;
  detail?: string;
  createdAt: string;
}
