import "server-only";
import { emptyDatabase, type Database } from "./store";
import { hashPassword } from "@/lib/auth/password";
import { writeUpload } from "./uploads";
import { MODULES } from "@/lib/domain/curriculum";
import { computeDomainCompletion } from "@/lib/domain/completion";
import type {
  Application, Certification, Institution, LearningProgress, Notification,
  Opportunity, Organization, PortfolioProject, SkillSignal, User,
} from "@/lib/types";

/**
 * Demo dataset for the MVP.
 *
 * Nothing in the application branches on these specific records — they are
 * ordinary rows. Point the repositories at a real database and the same screens
 * render institutional data instead.
 */

const DEMO_PASSWORD = "Demo@Skill2025";

/**
 * A minimal one-page PDF, written to the upload store so the seeded review
 * queue opens a real file rather than a dead link.
 */
const SAMPLE_CERTIFICATE_KEY = "0f1e2d3c4b5a69788796a5b4c3d2e1f0.pdf";
const SAMPLE_CERTIFICATE_PDF = new TextEncoder().encode(
  [
    "%PDF-1.4",
    "1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj",
    "2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj",
    "3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 420 300]/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>endobj",
    "4 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj",
    "5 0 obj<</Length 92>>stream",
    "BT /F1 18 Tf 40 200 Td (SQL for Data Analysis) Tj 0 -30 Td /F1 12 Tf (Nimbus Academy) Tj ET",
    "endstream endobj",
    "trailer<</Root 1 0 R>>",
    "%%EOF",
  ].join("\n"),
);

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86_400_000).toISOString();
}
function daysAhead(n: number): string {
  return new Date(Date.now() + n * 86_400_000).toISOString();
}
function dayKey(offset: number): string {
  return new Date(Date.now() - offset * 86_400_000).toISOString().slice(0, 10);
}

function signal(skillId: string, score: number, source: SkillSignal["source"], verified = false): SkillSignal {
  return {
    skillId,
    score,
    strength: score >= 75 ? "strong" : score >= 45 ? "developing" : score > 0 ? "weak" : "unknown",
    source,
    verified,
    updatedAt: daysAgo(3),
  };
}

export async function buildSeedDatabase(): Promise<Database> {
  const db = emptyDatabase();
  const passwordHash = await hashPassword(DEMO_PASSWORD);

  /* ---------------- Institutions & organizations ---------------- */

  const institutions: Institution[] = [
    {
      id: "inst_gcet", name: "Government College of Engineering, Pune", type: "college",
      city: "Pune", state: "Maharashtra", studentCount: 3200, createdAt: daysAgo(900),
      departments: ["Computer Engineering", "Information Technology", "Electronics", "Mechanical", "Civil"],
    },
    {
      id: "inst_svnit", name: "Sardar Vallabhbhai National Institute of Technology", type: "university",
      city: "Surat", state: "Gujarat", studentCount: 5400, createdAt: daysAgo(1200),
      departments: ["Computer Science", "Electronics & Communication", "Chemical", "Mechanical"],
    },
  ];

  const organizations: Organization[] = [
    { id: "org_nimbus", name: "Nimbus Cloud Systems", sector: "Cloud & Infrastructure", size: "1000-5000", city: "Bengaluru", website: "https://nimbus.example.com", about: "Managed cloud platform serving 400+ enterprises across APAC.", createdAt: daysAgo(700) },
    { id: "org_finlytic", name: "Finlytic Analytics", sector: "FinTech & Analytics", size: "200-1000", city: "Hyderabad", website: "https://finlytic.example.com", about: "Risk and fraud analytics for Indian lending markets.", createdAt: daysAgo(640) },
    { id: "org_axiom", name: "Axiom Security Labs", sector: "Cybersecurity", size: "50-200", city: "Pune", website: "https://axiomlabs.example.com", about: "Offensive security research and application security consulting.", createdAt: daysAgo(500) },
    { id: "org_vertex", name: "Vertex Product Studio", sector: "Product Engineering", size: "200-1000", city: "Remote", website: "https://vertexstudio.example.com", about: "Design-led product engineering for consumer platforms.", createdAt: daysAgo(430) },
  ];

  db.institutions = institutions;
  db.organizations = organizations;

  /* ---------------- Users ---------------- */

  const mk = (
    id: string, name: string, email: string, mobile: string,
    roles: User["roles"], activeRole: User["activeRole"],
    extra: Partial<User> = {},
  ): User => ({
    id, name, email, mobile, passwordHash, roles, activeRole,
    emailVerified: true, mobileVerified: true, onboardingComplete: true,
    createdAt: daysAgo(120), updatedAt: daysAgo(1), lastLoginAt: daysAgo(1),
    failedLoginCount: 0, ...extra,
  });

  const priya = mk("usr_priya", "Priya Sharma", "priya@student.demo", "+919812345001", ["student"], "student", { institutionId: "inst_gcet" });
  const arjun = mk("usr_arjun", "Arjun Menon", "arjun@student.demo", "+919812345002", ["student"], "student", { institutionId: "inst_gcet" });
  const kavya = mk("usr_kavya", "Kavya Reddy", "kavya@student.demo", "+919812345003", ["student"], "student", { institutionId: "inst_svnit" });
  const faculty = mk("usr_faculty", "Dr. Rohan Iyer", "faculty@demo.edu", "+919812345010", ["faculty"], "faculty", { institutionId: "inst_gcet" });
  const recruiter = mk("usr_recruiter", "Neha Kulkarni", "recruiter@nimbus.demo", "+919812345020", ["industry"], "industry", { organizationId: "org_nimbus" });
  const recruiter2 = mk("usr_recruiter2", "Sameer Joshi", "recruiter@axiom.demo", "+919812345021", ["industry"], "industry", { organizationId: "org_axiom" });
  const recruiter3 = mk("usr_recruiter3", "Meera Nair", "recruiter@vertex.demo", "+919812345022", ["industry"], "industry", { organizationId: "org_vertex" });
  const recruiter4 = mk("usr_recruiter4", "Vikram Rao", "recruiter@finlytic.demo", "+919812345023", ["industry"], "industry", { organizationId: "org_finlytic" });
  const cdc = mk("usr_cdc", "Anita Deshpande", "cdc@demo.edu", "+919812345030", ["institution"], "institution", { institutionId: "inst_gcet" });
  const admin = mk("usr_admin", "Platform Administrator", "admin@lincode.demo", "+919812345040", ["admin", "institution"], "admin");

  db.users = [priya, arjun, kavya, faculty, recruiter, recruiter2, recruiter3, recruiter4, cdc, admin];

  /* ---------------- Profiles ---------------- */

  db.studentProfiles = [
    {
      userId: priya.id, institutionId: "inst_gcet", institutionName: institutions[0].name,
      degree: "B.Tech", branch: "Computer Engineering", graduationYear: new Date().getFullYear() + 1,
      cgpa: 8.4, currentSemester: 6, location: "Pune, Maharashtra",
      headline: "Final-year CS student building full-stack products",
      about: "I like shipping things end to end — currently deepening my React and backend fundamentals while exploring applied ML.",
      careerInterests: ["Full Stack Engineer", "Product Engineer", "AI Engineer"],
      enrollments: [
        { domainId: "fullstack", declaredLevel: "intermediate", placedLevel: "intermediate", placementScore: 62, status: "in_progress", progress: 63, enrolledAt: daysAgo(90) },
        { domainId: "ml", declaredLevel: "beginner", placedLevel: "beginner", placementScore: null, status: "in_progress", progress: 27, enrolledAt: daysAgo(45) },
        { domainId: "cloud", declaredLevel: "beginner", placedLevel: "beginner", placementScore: null, status: "in_progress", progress: 10, enrolledAt: daysAgo(20) },
        { domainId: "data-science", declaredLevel: "intermediate", placedLevel: "advanced", placementScore: 88, status: "completed", progress: 100, enrolledAt: daysAgo(150), completedAt: daysAgo(12) },
      ],
      skillMatrix: Object.fromEntries(
        [
          signal("html", 88, "assessment", true), signal("css", 82, "assessment", true),
          signal("javascript", 58, "assessment"), signal("dom", 61, "module"),
          signal("async-js", 47, "assessment"), signal("react", 34, "assessment"),
          signal("typescript", 30, "self"), signal("rest-apis", 38, "assessment"),
          signal("nodejs", 42, "module"), signal("databases", 55, "assessment"),
          signal("auth", 26, "assessment"), signal("testing", 22, "self"),
          signal("git", 74, "module"), signal("python", 68, "assessment"),
          signal("stats", 80, "assessment", true), signal("sql-analytics", 84, "assessment", true),
          signal("data-viz", 76, "module", true), signal("numpy-pandas", 72, "assessment"),
          signal("communication", 71, "self"), signal("problem-solving", 69, "assessment"),
          signal("teamwork", 74, "self"),
        ].map((s) => [s.skillId, s]),
      ),
      updatedAt: daysAgo(2),
    },
    {
      userId: arjun.id, institutionId: "inst_gcet", institutionName: institutions[0].name,
      degree: "B.Tech", branch: "Information Technology", graduationYear: new Date().getFullYear() + 1,
      cgpa: 7.6, currentSemester: 6, location: "Pune, Maharashtra",
      headline: "Cloud and platform engineering enthusiast",
      careerInterests: ["Cloud Engineer", "DevOps Engineer"],
      enrollments: [
        { domainId: "cloud", declaredLevel: "intermediate", placedLevel: "intermediate", placementScore: 55, status: "in_progress", progress: 44, enrolledAt: daysAgo(70) },
        { domainId: "cybersecurity", declaredLevel: "beginner", placedLevel: "beginner", placementScore: null, status: "in_progress", progress: 18, enrolledAt: daysAgo(30) },
      ],
      skillMatrix: Object.fromEntries(
        [signal("linux", 72, "assessment"), signal("networking", 64, "assessment"), signal("cloud-core", 58, "module"),
         signal("containers", 49, "assessment"), signal("kubernetes", 21, "assessment"), signal("iac", 18, "self"),
         signal("cicd", 40, "module"), signal("git", 66, "module"), signal("sec-fundamentals", 35, "assessment")]
          .map((s) => [s.skillId, s]),
      ),
      updatedAt: daysAgo(4),
    },
    {
      userId: kavya.id, institutionId: "inst_svnit", institutionName: institutions[1].name,
      degree: "B.Tech", branch: "Computer Science", graduationYear: new Date().getFullYear(),
      cgpa: 9.1, currentSemester: 8, location: "Surat, Gujarat",
      headline: "Security-focused engineer, CTF regular",
      careerInterests: ["Security Analyst", "AppSec Engineer"],
      enrollments: [
        { domainId: "cybersecurity", declaredLevel: "advanced", placedLevel: "advanced", placementScore: 91, status: "in_progress", progress: 78, enrolledAt: daysAgo(160) },
        { domainId: "fullstack", declaredLevel: "intermediate", placedLevel: "intermediate", placementScore: 66, status: "in_progress", progress: 35, enrolledAt: daysAgo(60) },
      ],
      skillMatrix: Object.fromEntries(
        [signal("sec-fundamentals", 90, "assessment", true), signal("web-security", 86, "assessment", true),
         signal("cryptography", 78, "assessment"), signal("network-security", 71, "module"),
         signal("secure-coding", 68, "assessment"), signal("incident-response", 52, "module"),
         signal("linux", 80, "assessment"), signal("javascript", 62, "assessment"), signal("react", 44, "module")]
          .map((s) => [s.skillId, s]),
      ),
      updatedAt: daysAgo(6),
    },
  ];

  db.facultyProfiles = [{
    userId: faculty.id, institutionId: "inst_gcet", institutionName: institutions[0].name,
    department: "Computer Engineering", designation: "Associate Professor", yearsOfExperience: 14,
    researchAreas: ["Applied ML", "Edge Computing", "Engineering Education"],
    expertise: ["Distributed Systems", "Data Structures", "Curriculum Design"],
    publications: 27, updatedAt: daysAgo(20),
  }];

  db.industryProfiles = [
    { userId: recruiter.id, organizationId: "org_nimbus", companyName: "Nimbus Cloud Systems", designation: "Talent Lead — Engineering", industrySector: "Cloud & Infrastructure", companySize: "1000-5000", website: "https://nimbus.example.com", hiringFor: ["Cloud Engineer", "Full Stack Engineer", "SRE"], updatedAt: daysAgo(15) },
    { userId: recruiter2.id, organizationId: "org_axiom", companyName: "Axiom Security Labs", designation: "Head of Talent", industrySector: "Cybersecurity", companySize: "50-200", website: "https://axiomlabs.example.com", hiringFor: ["Security Analyst", "AppSec Engineer"], updatedAt: daysAgo(18) },
    { userId: recruiter3.id, organizationId: "org_vertex", companyName: "Vertex Product Studio", designation: "Engineering Manager", industrySector: "Product Engineering", companySize: "200-1000", website: "https://vertexstudio.example.com", hiringFor: ["Frontend Developer", "Full Stack Engineer", "Product Engineer"], updatedAt: daysAgo(14) },
    { userId: recruiter4.id, organizationId: "org_finlytic", companyName: "Finlytic Analytics", designation: "Head of Early Careers", industrySector: "FinTech & Analytics", companySize: "200-1000", website: "https://finlytic.example.com", hiringFor: ["Data Analyst", "Data Scientist", "ML Engineer"], updatedAt: daysAgo(12) },
  ];

  db.institutionProfiles = [
    { userId: cdc.id, institutionId: "inst_gcet", designation: "Head — Career Development Cell", department: "Placement Office", updatedAt: daysAgo(25) },
    { userId: admin.id, institutionId: "inst_gcet", designation: "Platform Administrator", updatedAt: daysAgo(25) },
  ];

  /* ---------------- Learning progress & streaks ---------------- */

  const progress: LearningProgress[] = [];
  const completeFor = (userId: string, domainId: string, count: number) => {
    MODULES.filter((m) => m.domainId === domainId)
      .slice(0, count)
      .forEach((m, i) => {
        progress.push({
          id: `prog_${userId}_${m.id}`, userId, domainId, moduleId: m.id,
          status: "completed", percent: 100,
          startedAt: daysAgo(60 - i * 2), completedAt: daysAgo(58 - i * 2), updatedAt: daysAgo(58 - i * 2),
        });
      });
  };
  completeFor(priya.id, "fullstack", 8);
  completeFor(priya.id, "ml", 3);
  completeFor(priya.id, "cloud", 1);
  completeFor(priya.id, "data-science", 8);
  completeFor(arjun.id, "cloud", 4);
  completeFor(arjun.id, "cybersecurity", 2);
  completeFor(kavya.id, "cybersecurity", 7);
  completeFor(kavya.id, "fullstack", 4);
  db.learningProgress = progress;

  // Derive each enrolment's progress from the modules actually completed, so the
  // seeded percentage can never drift from the module counts the UI shows.
  for (const profile of db.studentProfiles) {
    const done = new Set(
      progress.filter((p) => p.userId === profile.userId && p.status === "completed").map((p) => p.moduleId),
    );
    profile.enrollments = profile.enrollments.map((enrollment) => {
      const domainModules = MODULES.filter((m) => m.domainId === enrollment.domainId);
      const { percent } = computeDomainCompletion(undefined, domainModules, done);
      const completed = percent >= 100;
      return {
        ...enrollment,
        progress: percent,
        status: completed ? "completed" : percent > 0 ? "in_progress" : "not_started",
        completedAt: completed ? (enrollment.completedAt ?? daysAgo(12)) : undefined,
      };
    });
  }

  // A 7-day active streak for the primary demo student, with a realistic history.
  const priyaHistory: Record<string, number> = {};
  for (let i = 0; i < 7; i++) priyaHistory[dayKey(i)] = 1 + (i % 3);
  for (let i = 9; i < 22; i++) if (i % 4 !== 0) priyaHistory[dayKey(i)] = 1;
  db.streaks = [
    { userId: priya.id, current: 7, longest: 19, lastActiveDay: dayKey(0), history: priyaHistory, updatedAt: daysAgo(0) },
    { userId: arjun.id, current: 2, longest: 11, lastActiveDay: dayKey(0), history: { [dayKey(0)]: 1, [dayKey(1)]: 2 }, updatedAt: daysAgo(0) },
    { userId: kavya.id, current: 0, longest: 24, lastActiveDay: dayKey(4), history: { [dayKey(4)]: 3, [dayKey(5)]: 1 }, updatedAt: daysAgo(4) },
  ];
  db.streakActivities = Object.entries(priyaHistory).flatMap(([day, count]) =>
    Array.from({ length: count }, (_, i) => ({
      id: `act_${day}_${i}`, userId: priya.id, type: "module_completed" as const,
      day, domainId: "fullstack", minutes: 35, createdAt: `${day}T12:0${i}:00.000Z`,
    })),
  );

  /* ---------------- Portfolio ---------------- */

  const certs: Certification[] = [
    { id: "cert_1", userId: priya.id, name: "Data Science Professional Certificate", issuer: "Finlytic Analytics", issuedOn: daysAgo(14), credentialId: "FIN-DS-4821", credentialUrl: "https://finlytic.example.com/verify/FIN-DS-4821", skillIds: ["stats", "sql-analytics", "data-viz"], verified: true, verifiedBy: "org_finlytic", verificationStatus: "verified", reviewedAt: daysAgo(12) },
    { id: "cert_2", userId: priya.id, name: "Responsive Web Design", issuer: "freeCodeCamp", issuedOn: daysAgo(210), credentialUrl: "https://www.freecodecamp.org/certification", skillIds: ["html", "css"], verified: true, verifiedBy: "inst_gcet", verificationStatus: "verified", reviewedAt: daysAgo(200) },
    { id: "cert_3", userId: priya.id, name: "SQL for Data Analysis", issuer: "Nimbus Academy", issuedOn: daysAgo(95), skillIds: ["sql-analytics", "databases"], verified: false, verificationStatus: "pending", documentId: "doc_cert_sql", submittedAt: daysAgo(3) },
    { id: "cert_4", userId: kavya.id, name: "Web Application Security Practitioner", issuer: "Axiom Security Labs", issuedOn: daysAgo(40), skillIds: ["web-security", "secure-coding"], verified: true, verifiedBy: "org_axiom", verificationStatus: "verified", reviewedAt: daysAgo(35) },
  ];
  db.certifications = certs;

  const projects: PortfolioProject[] = [
    { id: "proj_1", userId: priya.id, title: "Campus Placement Analytics Dashboard", description: "Analysed five years of placement records for 3,200 students and shipped an interactive dashboard the CDC now uses during recruitment season.", repoUrl: "https://github.com/example/placement-analytics", liveUrl: "https://placement-analytics.example.com", skillIds: ["python", "sql-analytics", "data-viz", "stats"], highlights: ["Cut report preparation from 3 days to 20 minutes", "Surfaced a branch-level skill gap that changed the training plan", "Adopted by the department's career cell"], completedOn: daysAgo(30), verified: true },
    { id: "proj_2", userId: priya.id, title: "StudyLoop — spaced repetition PWA", description: "Offline-first study app with a scheduling algorithm based on forgetting curves. 400+ active users from two colleges.", repoUrl: "https://github.com/example/studyloop", skillIds: ["html", "css", "javascript", "dom"], highlights: ["Installable PWA with offline sync", "94 Lighthouse performance score"], completedOn: daysAgo(120), verified: false },
    { id: "proj_3", userId: kavya.id, title: "Vulnerable-by-design training range", description: "A deliberately insecure application plus guided exercises used in the college's security elective.", repoUrl: "https://github.com/example/sec-range", skillIds: ["web-security", "secure-coding"], highlights: ["Used by 120 students across two semesters"], completedOn: daysAgo(60), verified: true },
  ];
  db.projects = projects;

  db.achievements = [
    { id: "ach_1", userId: priya.id, title: "Winner — Smart India Hackathon (Internal Round)", description: "Led a team of six to first place with an accessibility-focused civic reporting platform.", awardedBy: institutions[0].name, awardedOn: daysAgo(75), verified: true },
    { id: "ach_2", userId: priya.id, title: "Top 5% — National Data Science Challenge", description: "Ranked 41st of 900+ participants in a fraud detection challenge.", awardedBy: "Finlytic Analytics", awardedOn: daysAgo(160), verified: true },
    { id: "ach_3", userId: kavya.id, title: "CTF — 2nd place, WestZone Regional", description: "Web exploitation and cryptography categories.", awardedBy: "Axiom Security Labs", awardedOn: daysAgo(50), verified: true },
  ];

  db.academicRecords = [
    { id: "acad_1", userId: priya.id, term: "Semester 5", gpa: 8.6, credits: 24, highlights: ["Database Systems — A", "Operating Systems — A-"], verifiedByInstitution: true },
    { id: "acad_2", userId: priya.id, term: "Semester 4", gpa: 8.2, credits: 24, highlights: ["Data Structures — A", "Computer Networks — B+"], verifiedByInstitution: true },
    { id: "acad_3", userId: priya.id, term: "Semester 3", gpa: 8.4, credits: 22, highlights: ["Discrete Mathematics — A"], verifiedByInstitution: true },
  ];

  await writeUpload(SAMPLE_CERTIFICATE_KEY, SAMPLE_CERTIFICATE_PDF);
  db.documents = [
    { id: "doc_1", ownerId: priya.id, kind: "resume", filename: "priya-sharma-resume.pdf", mimeType: "application/pdf", sizeBytes: 184_320, storageKey: "resumes/usr_priya/current.pdf", uploadedAt: daysAgo(9), sharedWith: [] },
    { id: "doc_2", ownerId: priya.id, kind: "certificate", filename: "finlytic-ds-certificate.pdf", mimeType: "application/pdf", sizeBytes: 96_400, storageKey: "certificates/usr_priya/fin-ds-4821.pdf", uploadedAt: daysAgo(14), sharedWith: [] },
    { id: "doc_3", ownerId: kavya.id, kind: "resume", filename: "kavya-reddy-resume.pdf", mimeType: "application/pdf", sizeBytes: 172_100, storageKey: "resumes/usr_kavya/current.pdf", uploadedAt: daysAgo(20), sharedWith: [] },
    // Evidence behind cert_3, which is waiting on the institution's review. The
    // other fixtures carry metadata only; this one has real bytes on disk so the
    // review queue can actually open something.
    { id: "doc_cert_sql", ownerId: priya.id, kind: "certificate", filename: "nimbus-sql-certificate.pdf", mimeType: "application/pdf", sizeBytes: SAMPLE_CERTIFICATE_PDF.byteLength, storageKey: SAMPLE_CERTIFICATE_KEY, uploadedAt: daysAgo(3), sharedWith: [] },
  ];

  /* ---------------- Opportunities ---------------- */

  const req = (skillId: string, minimumScore: number, mandatory = false, weight = 1) => ({ skillId, minimumScore, weight, mandatory });
  const currentYear = new Date().getFullYear();

  const opportunities: Opportunity[] = [
    {
      id: "opp_frontend_intern", type: "internship", organizationId: "org_vertex", postedByUserId: recruiter3.id,
      title: "Frontend Developer Intern", location: "Remote (India)", workMode: "remote",
      description: "Work alongside our product team building customer-facing interfaces in React and TypeScript. You will own real features behind flags, from design handoff to production.",
      stipend: "₹25,000/month", durationMonths: 6, domainIds: ["fullstack"],
      requirements: [req("react", 60, true, 2), req("javascript", 65, true, 2), req("rest-apis", 45, false, 1.5), req("typescript", 50, false, 1), req("css", 55, false, 1)],
      eligibility: { degrees: ["B.Tech", "B.E.", "BCA", "MCA"], branches: ["Computer Engineering", "Information Technology", "Computer Science"], graduationYears: [currentYear, currentYear + 1], minCgpa: 6.5 },
      openings: 4, deadline: daysAhead(18), status: "open", createdAt: daysAgo(10),
    },
    {
      id: "opp_backend_intern", type: "internship", organizationId: "org_nimbus", postedByUserId: recruiter.id,
      title: "Backend Engineering Intern", location: "Bengaluru", workMode: "hybrid",
      description: "Build and operate API services that back our cloud console. Expect real on-call shadowing, code review from senior engineers, and a production deploy in week three.",
      stipend: "₹35,000/month", durationMonths: 6, domainIds: ["fullstack", "cloud"],
      requirements: [req("nodejs", 55, true, 2), req("databases", 55, true, 2), req("rest-apis", 60, true, 1.5), req("auth", 40, false, 1), req("git", 50, false, 1)],
      eligibility: { degrees: ["B.Tech", "B.E.", "M.Tech"], branches: ["Computer Engineering", "Information Technology", "Computer Science"], graduationYears: [currentYear, currentYear + 1], minCgpa: 7 },
      openings: 6, deadline: daysAhead(25), status: "open", createdAt: daysAgo(7),
    },
    {
      id: "opp_data_analyst", type: "job", organizationId: "org_finlytic", postedByUserId: recruiter4.id,
      title: "Data Analyst (Graduate)", location: "Hyderabad", workMode: "onsite",
      description: "Own reporting and experiment analysis for our lending risk products. You will write the SQL, run the tests and present the recommendation yourself.",
      salaryLpa: "₹8–11 LPA", domainIds: ["data-science"],
      requirements: [req("sql-analytics", 70, true, 2), req("stats", 65, true, 2), req("data-viz", 60, false, 1.5), req("python", 55, false, 1), req("data-storytelling", 50, false, 1)],
      eligibility: { degrees: ["B.Tech", "B.E.", "B.Sc", "M.Sc"], branches: [], graduationYears: [currentYear, currentYear + 1], minCgpa: 7 },
      openings: 3, deadline: daysAhead(30), status: "open", createdAt: daysAgo(14),
    },
    {
      id: "opp_cloud_intern", type: "internship", organizationId: "org_nimbus", postedByUserId: recruiter.id,
      title: "Cloud Platform Intern", location: "Bengaluru", workMode: "hybrid",
      description: "Join the platform team automating environment provisioning across three regions. Terraform, Kubernetes and a lot of debugging other people's YAML.",
      stipend: "₹30,000/month", durationMonths: 6, domainIds: ["cloud"],
      requirements: [req("linux", 60, true, 2), req("containers", 55, true, 2), req("kubernetes", 45, false, 1.5), req("iac", 40, false, 1.5), req("networking", 50, false, 1)],
      eligibility: { degrees: ["B.Tech", "B.E."], branches: ["Computer Engineering", "Information Technology", "Computer Science", "Electronics & Communication"], graduationYears: [currentYear, currentYear + 1], minCgpa: 6.5 },
      openings: 5, deadline: daysAhead(21), status: "open", createdAt: daysAgo(9),
    },
    {
      id: "opp_secanalyst", type: "job", organizationId: "org_axiom", postedByUserId: recruiter2.id,
      title: "Security Analyst — Application Security", location: "Pune", workMode: "onsite",
      description: "Assess client web applications, write the findings report, and work with their engineers on remediation. Mentored by senior consultants for the first six months.",
      salaryLpa: "₹9–13 LPA", domainIds: ["cybersecurity"],
      requirements: [req("web-security", 70, true, 2.5), req("sec-fundamentals", 65, true, 2), req("secure-coding", 60, false, 1.5), req("networking", 50, false, 1), req("cryptography", 50, false, 1)],
      eligibility: { degrees: ["B.Tech", "B.E.", "M.Tech"], branches: [], graduationYears: [currentYear, currentYear + 1], minCgpa: 7 },
      openings: 2, deadline: daysAhead(28), status: "open", createdAt: daysAgo(11),
    },
    {
      id: "opp_ml_apprentice", type: "apprenticeship", organizationId: "org_finlytic", postedByUserId: recruiter4.id,
      title: "Applied ML Apprenticeship", location: "Hyderabad", workMode: "hybrid",
      description: "A 12-month structured apprenticeship: two months of guided training, then production model work on fraud detection with a named mentor.",
      stipend: "₹40,000/month", durationMonths: 12, domainIds: ["ml", "data-science"],
      requirements: [req("python", 65, true, 2), req("ml-supervised", 55, true, 2), req("model-eval", 50, false, 1.5), req("numpy-pandas", 60, false, 1.5), req("feature-eng", 45, false, 1)],
      eligibility: { degrees: ["B.Tech", "B.E.", "M.Tech", "M.Sc"], branches: [], graduationYears: [currentYear, currentYear + 1], minCgpa: 7.5 },
      openings: 4, deadline: daysAhead(35), status: "open", createdAt: daysAgo(5),
    },
    {
      id: "opp_fullstack_project", type: "project", organizationId: "org_vertex", postedByUserId: recruiter3.id,
      title: "Live Project — Accessibility Audit & Rebuild", location: "Remote", workMode: "remote",
      description: "An 8-week paid live project: audit our public site against WCAG 2.2 AA and rebuild the three worst-scoring flows with our design team.",
      stipend: "₹15,000 total", durationMonths: 2, domainIds: ["fullstack"],
      requirements: [req("html", 70, true, 2), req("css", 65, true, 2), req("javascript", 50, false, 1), req("react", 40, false, 1)],
      eligibility: { degrees: [], branches: [], graduationYears: [currentYear, currentYear + 1, currentYear + 2] },
      openings: 8, deadline: daysAhead(12), status: "open", createdAt: daysAgo(4),
    },
    {
      id: "opp_sde_grad", type: "job", organizationId: "org_nimbus", postedByUserId: recruiter.id,
      title: "Software Engineer — Graduate Programme", location: "Bengaluru", workMode: "hybrid",
      description: "Our graduate intake rotates through three teams in the first year before you choose where to land. Full-stack fundamentals matter more than any specific framework.",
      salaryLpa: "₹12–16 LPA", domainIds: ["fullstack", "cloud"],
      requirements: [req("javascript", 65, true, 2), req("databases", 60, true, 2), req("rest-apis", 60, true, 1.5), req("react", 50, false, 1), req("testing", 45, false, 1), req("git", 60, false, 1)],
      eligibility: { degrees: ["B.Tech", "B.E.", "M.Tech"], branches: [], graduationYears: [currentYear, currentYear + 1], minCgpa: 7.5 },
      openings: 12, deadline: daysAhead(40), status: "open", createdAt: daysAgo(3),
    },
  ];
  db.opportunities = opportunities;

  /* ---------------- Applications ---------------- */

  const applications: Application[] = [
    {
      id: "app_1", opportunityId: "opp_data_analyst", studentId: priya.id, stage: "interview", matchScore: 86,
      coverNote: "My placement analytics dashboard is the closest thing I have to this role — happy to walk through the methodology.",
      resumeDocumentId: "doc_1", createdAt: daysAgo(16), updatedAt: daysAgo(2),
      timeline: [
        { stage: "applied", at: daysAgo(16), actorId: priya.id },
        { stage: "under_review", at: daysAgo(13), actorId: recruiter4.id, note: "Strong SQL and statistics signals." },
        { stage: "shortlisted", at: daysAgo(8), actorId: recruiter4.id, note: "Shortlisted for the analytics round." },
        { stage: "interview", at: daysAgo(2), actorId: recruiter4.id, note: "Technical interview scheduled." },
      ],
    },
    {
      id: "app_2", opportunityId: "opp_frontend_intern", studentId: priya.id, stage: "under_review", matchScore: 58,
      resumeDocumentId: "doc_1", createdAt: daysAgo(6), updatedAt: daysAgo(4),
      timeline: [
        { stage: "applied", at: daysAgo(6), actorId: priya.id },
        { stage: "under_review", at: daysAgo(4), actorId: recruiter3.id },
      ],
    },
    {
      id: "app_3", opportunityId: "opp_fullstack_project", studentId: priya.id, stage: "applied", matchScore: 74,
      createdAt: daysAgo(2), updatedAt: daysAgo(2),
      timeline: [{ stage: "applied", at: daysAgo(2), actorId: priya.id }],
    },
    {
      id: "app_4", opportunityId: "opp_cloud_intern", studentId: arjun.id, stage: "shortlisted", matchScore: 71,
      createdAt: daysAgo(12), updatedAt: daysAgo(3),
      timeline: [
        { stage: "applied", at: daysAgo(12), actorId: arjun.id },
        { stage: "under_review", at: daysAgo(9), actorId: recruiter.id },
        { stage: "shortlisted", at: daysAgo(3), actorId: recruiter.id, note: "Good Linux and container fundamentals." },
      ],
    },
    {
      id: "app_5", opportunityId: "opp_secanalyst", studentId: kavya.id, stage: "selected", matchScore: 92,
      createdAt: daysAgo(30), updatedAt: daysAgo(5),
      timeline: [
        { stage: "applied", at: daysAgo(30), actorId: kavya.id },
        { stage: "under_review", at: daysAgo(26), actorId: recruiter2.id },
        { stage: "shortlisted", at: daysAgo(20), actorId: recruiter2.id },
        { stage: "interview", at: daysAgo(12), actorId: recruiter2.id },
        { stage: "selected", at: daysAgo(5), actorId: recruiter2.id, note: "Offer extended." },
      ],
    },
    {
      id: "app_7", opportunityId: "opp_backend_intern", studentId: priya.id, stage: "applied", matchScore: 61,
      coverNote: "I've shipped a paginated JSON API in my capstone and want to go deeper on the operational side.",
      resumeDocumentId: "doc_1", createdAt: daysAgo(4), updatedAt: daysAgo(4),
      timeline: [{ stage: "applied", at: daysAgo(4), actorId: priya.id }],
    },
    {
      id: "app_8", opportunityId: "opp_sde_grad", studentId: kavya.id, stage: "under_review", matchScore: 68,
      resumeDocumentId: "doc_3", createdAt: daysAgo(9), updatedAt: daysAgo(6),
      timeline: [
        { stage: "applied", at: daysAgo(9), actorId: kavya.id },
        { stage: "under_review", at: daysAgo(6), actorId: recruiter.id, note: "Strong security fundamentals; checking breadth." },
      ],
    },
    {
      id: "app_6", opportunityId: "opp_backend_intern", studentId: arjun.id, stage: "rejected", matchScore: 44,
      createdAt: daysAgo(22), updatedAt: daysAgo(15),
      timeline: [
        { stage: "applied", at: daysAgo(22), actorId: arjun.id },
        { stage: "under_review", at: daysAgo(19), actorId: recruiter.id },
        { stage: "rejected", at: daysAgo(15), actorId: recruiter.id, note: "Backend fundamentals not yet at the required depth — encouraged to reapply next cycle." },
      ],
    },
  ];
  db.applications = applications;

  /* ---------------- Industry <-> academia collaboration ---------------- */

  db.collaborationPrograms = [
    { id: "col_fdp_ai", kind: "fdp", organizationId: "org_finlytic", postedByUserId: recruiter4.id, title: "FDP: Teaching Applied Machine Learning", description: "A two-week faculty development programme covering an industry-aligned ML curriculum, assessment design and capstone supervision.", audience: ["faculty"], mode: "hybrid", location: "Hyderabad + online", startsOn: daysAhead(30), durationWeeks: 2, seats: 40, stipend: "₹20,000 honorarium", focusAreas: ["Curriculum design", "Applied ML", "Assessment"], deadline: daysAhead(20), status: "open", createdAt: daysAgo(12) },
    { id: "col_faculty_intern", kind: "faculty_internship", organizationId: "org_nimbus", postedByUserId: recruiter.id, title: "Faculty Summer Internship — Cloud Platform", description: "Six weeks embedded with our platform engineering team. Return to your department with production experience and a co-designed lab module.", audience: ["faculty"], mode: "onsite", location: "Bengaluru", startsOn: daysAhead(60), durationWeeks: 6, seats: 8, stipend: "₹75,000 total", focusAreas: ["Kubernetes", "Infrastructure as code", "Observability"], deadline: daysAhead(35), status: "open", createdAt: daysAgo(20) },
    { id: "col_consultancy", kind: "consultancy", organizationId: "org_axiom", postedByUserId: recruiter2.id, title: "Consultancy — Secure Code Review Panel", description: "We are building a standing panel of academic reviewers for client security assessments. Paid per engagement, roughly one week per quarter.", audience: ["faculty"], mode: "remote", location: "Remote", startsOn: daysAhead(15), durationWeeks: 12, seats: 6, stipend: "₹60,000 per engagement", focusAreas: ["Application security", "Secure coding", "Threat modelling"], deadline: daysAhead(25), status: "open", createdAt: daysAgo(8) },
    { id: "col_research", kind: "research", organizationId: "org_finlytic", postedByUserId: recruiter4.id, title: "Collaborative Research — Fairness in Credit Scoring", description: "Joint research on bias measurement and mitigation in credit models. Funded, with co-authorship and access to an anonymised dataset.", audience: ["faculty"], mode: "hybrid", location: "Hyderabad + remote", startsOn: daysAhead(45), durationWeeks: 52, seats: 3, stipend: "₹6,00,000 grant", focusAreas: ["Fairness", "Model governance", "Explainability"], deadline: daysAhead(40), status: "open", createdAt: daysAgo(16) },
    { id: "col_training", kind: "industrial_training", organizationId: "org_nimbus", postedByUserId: recruiter.id, title: "Industrial Training — Modern DevOps Toolchain", description: "A one-week intensive for faculty and senior students on the toolchain we actually run in production.", audience: ["faculty", "student"], mode: "onsite", location: "Pune", startsOn: daysAhead(25), durationWeeks: 1, seats: 30, focusAreas: ["CI/CD", "Containers", "Monitoring"], deadline: daysAhead(18), status: "open", createdAt: daysAgo(6) },
    { id: "col_guest", kind: "guest_lecture", organizationId: "org_axiom", postedByUserId: recruiter2.id, title: "Guest Lecture Series — Security in the Real World", description: "Our consultants deliver case-study lectures at partner institutions. Book a slot for your department.", audience: ["faculty", "institution"], mode: "hybrid", location: "Partner campuses", startsOn: daysAhead(10), durationWeeks: 8, seats: 20, focusAreas: ["Incident response", "AppSec", "Career paths"], deadline: daysAhead(30), status: "open", createdAt: daysAgo(9) },
    { id: "col_hack", kind: "innovation_challenge", organizationId: "org_vertex", postedByUserId: recruiter3.id, title: "Innovation Challenge — Accessible Civic Tech", description: "A six-week challenge open to student teams with faculty mentors. Winning teams get a paid live project and mentorship.", audience: ["student", "faculty", "institution"], mode: "remote", location: "Remote", startsOn: daysAhead(20), durationWeeks: 6, seats: 100, stipend: "₹2,00,000 prize pool", focusAreas: ["Accessibility", "Civic technology", "Product design"], deadline: daysAhead(14), status: "open", createdAt: daysAgo(7) },
    { id: "col_mentorship", kind: "mentorship", organizationId: "org_nimbus", postedByUserId: recruiter.id, title: "1:1 Engineering Mentorship Cohort", description: "Senior engineers mentor final-year students for one hour a fortnight across a semester.", audience: ["student", "faculty"], mode: "remote", location: "Remote", startsOn: daysAhead(12), durationWeeks: 16, seats: 50, focusAreas: ["Career guidance", "Code review", "System design"], deadline: daysAhead(10), status: "open", createdAt: daysAgo(5) },
    { id: "col_workshop", kind: "workshop", organizationId: "org_finlytic", postedByUserId: recruiter4.id, title: "Workshop — From Notebook to Production", description: "A hands-on day taking a model from a notebook to a monitored endpoint.", audience: ["student", "faculty"], mode: "onsite", location: "Hyderabad", startsOn: daysAhead(18), durationWeeks: 1, seats: 60, focusAreas: ["MLOps", "Deployment", "Monitoring"], deadline: daysAhead(15), status: "open", createdAt: daysAgo(4) },
    { id: "col_liveproject", kind: "live_project", organizationId: "org_vertex", postedByUserId: recruiter3.id, title: "Live Project — Design System Migration", description: "Student teams work on a real migration under our engineering leads, with weekly reviews.", audience: ["student", "faculty"], mode: "remote", location: "Remote", startsOn: daysAhead(22), durationWeeks: 10, seats: 24, stipend: "₹12,000/month", focusAreas: ["React", "Design systems", "Testing"], deadline: daysAhead(16), status: "open", createdAt: daysAgo(3) },
  ];

  db.trainingPrograms = [
    { id: "trn_react", organizationId: "org_vertex", postedByUserId: recruiter3.id, title: "Production React — Industry Certification", description: "The React patterns our teams actually use, assessed by a real code review. Certificate is verifiable on your LinCode portfolio.", kind: "certification", domainIds: ["fullstack"], skillIds: ["react", "typescript", "testing"], level: "intermediate", durationWeeks: 6, mode: "cohort", certificateOffered: true, seats: 120, startsOn: daysAhead(14), status: "open", createdAt: daysAgo(10) },
    { id: "trn_cloud", organizationId: "org_nimbus", postedByUserId: recruiter.id, title: "Cloud Foundations Bootcamp", description: "Four weeks of guided labs on compute, networking, IAM and containers, ending in a graded deployment.", kind: "training", domainIds: ["cloud"], skillIds: ["cloud-core", "containers", "networking", "cloud-security"], level: "beginner", durationWeeks: 4, mode: "cohort", certificateOffered: true, seats: 200, startsOn: daysAhead(9), status: "open", createdAt: daysAgo(15) },
    { id: "trn_appsec", organizationId: "org_axiom", postedByUserId: recruiter2.id, title: "Application Security Essentials", description: "Hands-on OWASP Top 10 with a vulnerable app you exploit and then fix.", kind: "workshop", domainIds: ["cybersecurity"], skillIds: ["web-security", "secure-coding"], level: "intermediate", durationWeeks: 2, mode: "live", certificateOffered: true, seats: 80, startsOn: daysAhead(11), status: "open", createdAt: daysAgo(8) },
    { id: "trn_ml", organizationId: "org_finlytic", postedByUserId: recruiter4.id, title: "Applied ML Mentorship Track", description: "Eight weeks of mentored project work with a practising ML engineer.", kind: "mentorship", domainIds: ["ml", "data-science"], skillIds: ["ml-supervised", "model-eval", "feature-eng"], level: "intermediate", durationWeeks: 8, mode: "cohort", certificateOffered: true, seats: 40, startsOn: daysAhead(20), status: "open", createdAt: daysAgo(6) },
  ];

  db.programApplications = [
    { id: "papp_1", programId: "col_fdp_ai", applicantId: faculty.id, applicantRole: "faculty", stage: "shortlisted", note: "I teach the ML elective and would like to align it with industry expectations.", createdAt: daysAgo(9), updatedAt: daysAgo(4), timeline: [{ stage: "applied", at: daysAgo(9), actorId: faculty.id }, { stage: "under_review", at: daysAgo(6), actorId: recruiter.id }, { stage: "shortlisted", at: daysAgo(4), actorId: recruiter.id }] },
    { id: "papp_2", programId: "col_research", applicantId: faculty.id, applicantRole: "faculty", stage: "under_review", createdAt: daysAgo(5), updatedAt: daysAgo(3), timeline: [{ stage: "applied", at: daysAgo(5), actorId: faculty.id }, { stage: "under_review", at: daysAgo(3), actorId: recruiter.id }] },
  ];

  db.enrollments = [
    { id: "enr_1", programId: "trn_react", userId: priya.id, progress: 40, status: "enrolled", createdAt: daysAgo(11) },
    { id: "enr_2", programId: "trn_cloud", userId: arjun.id, progress: 65, status: "enrolled", createdAt: daysAgo(18) },
  ];

  /* ---------------- Notifications ---------------- */

  const notifications: Notification[] = [
    { id: "ntf_1", userId: priya.id, title: "Interview scheduled", body: "Finlytic Analytics moved your Data Analyst application to the interview stage.", kind: "action", href: "/student/applications", read: false, createdAt: daysAgo(2) },
    { id: "ntf_2", userId: priya.id, title: "New match: 84% skill fit", body: "Frontend Developer Intern at Vertex Product Studio matches your Full Stack profile.", kind: "info", href: "/student/internships", read: false, createdAt: daysAgo(3) },
    { id: "ntf_3", userId: priya.id, title: "7-day streak", body: "You have learned seven days in a row. Your longest streak is 19 days.", kind: "success", href: "/student/streak", read: true, createdAt: daysAgo(0) },
    { id: "ntf_4", userId: faculty.id, title: "FDP shortlist", body: "You have been shortlisted for the Applied ML faculty development programme.", kind: "success", href: "/faculty/fdp", read: false, createdAt: daysAgo(4) },
    { id: "ntf_5", userId: recruiter.id, title: "New applicants", body: "Your Backend Engineering Intern posting received new applications this week.", kind: "info", href: "/industry/applicants", read: false, createdAt: daysAgo(1) },
    { id: "ntf_7", userId: recruiter3.id, title: "New application", body: "Priya Sharma applied to Frontend Developer Intern.", kind: "info", href: "/industry/applicants", read: false, createdAt: daysAgo(6) },
    { id: "ntf_6", userId: cdc.id, title: "Placement readiness up 6%", body: "Department placement readiness improved this month, led by Computer Engineering.", kind: "success", href: "/institution/analytics", read: false, createdAt: daysAgo(2) },
  ];
  db.notifications = notifications;

  return db;
}

export const DEMO_CREDENTIALS = [
  { role: "Student", email: "priya@student.demo", password: DEMO_PASSWORD, note: "Fully onboarded — four domains, 7-day streak, live applications." },
  { role: "Faculty", email: "faculty@demo.edu", password: DEMO_PASSWORD, note: "FDPs, faculty internships, consultancy and research." },
  { role: "Industry", email: "recruiter@nimbus.demo", password: DEMO_PASSWORD, note: "Postings, applicant pipeline and training programmes." },
  { role: "Institution", email: "cdc@demo.edu", password: DEMO_PASSWORD, note: "Cohort analytics, skill gaps and placement progress." },
];
