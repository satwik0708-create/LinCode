import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

/**
 * Integration checks against the real datastore, seeded with the demo dataset.
 * DATA_DIR is pointed at a throwaway directory before the store module loads,
 * so these never touch a developer's working data.
 */
let dir: string;
let portfolio: typeof import("../src/lib/data/portfolio");
let opportunities: typeof import("../src/lib/data/opportunities");
let learning: typeof import("../src/lib/data/learning");
let users: typeof import("../src/lib/data/users");

before(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "lincode-test-"));
  process.env.DATA_DIR = dir;
  portfolio = await import("../src/lib/data/portfolio");
  opportunities = await import("../src/lib/data/opportunities");
  learning = await import("../src/lib/data/learning");
  users = await import("../src/lib/data/users");
});

after(async () => {
  await rm(dir, { recursive: true, force: true });
});

test("a student can read their own document", async () => {
  const verdict = await portfolio.canReadDocument("doc_1", { id: "usr_priya", role: "student" });
  assert.equal(verdict.allowed, true);
});

test("a student cannot read another student's document", async () => {
  const verdict = await portfolio.canReadDocument("doc_3", { id: "usr_priya", role: "student" });
  assert.equal(verdict.allowed, false);
  assert.equal(verdict.reason, "forbidden");
});

test("a recruiter can read a resume attached to their own posting", async () => {
  // doc_1 is attached to app_1, which is against a Nimbus-owned posting.
  const verdict = await portfolio.canReadDocument("doc_1", {
    id: "usr_recruiter", role: "industry", organizationId: "org_nimbus",
  });
  assert.equal(verdict.allowed, true);
});

test("a recruiter cannot read a document that was never attached to their posting", async () => {
  // doc_2 is Priya's certificate — attached to no application at all.
  const verdict = await portfolio.canReadDocument("doc_2", {
    id: "usr_recruiter", role: "industry", organizationId: "org_nimbus",
  });
  assert.equal(verdict.allowed, false);
});

test("a recruiter cannot read a resume attached only to a rival's posting", async () => {
  // doc_1 reaches Nimbus through app_7; Axiom has no such link to it.
  const verdict = await portfolio.canReadDocument("doc_1", {
    id: "usr_recruiter2", role: "industry", organizationId: "org_axiom",
  });
  assert.equal(verdict.allowed, false);
});

test("an institution cannot read a student's private certificate", async () => {
  // Academic records are institutional; a personal certificate is not.
  const verdict = await portfolio.canReadDocument("doc_2", {
    id: "usr_cdc", role: "institution", institutionId: "inst_gcet",
  });
  assert.equal(verdict.allowed, false);
});

test("an institution may read a certificate only while it is evidence it must review", async () => {
  // doc_cert_sql backs cert_3, which is pending review by inst_gcet.
  const during = await portfolio.canReadDocument("doc_cert_sql", {
    id: "usr_cdc", role: "institution", institutionId: "inst_gcet",
  });
  assert.equal(during.allowed, true, "the reviewer must be able to open the evidence");

  // A different institution never gets in, review or not.
  const outsider = await portfolio.canReadDocument("doc_cert_sql", {
    id: "usr_other", role: "institution", institutionId: "inst_svnit",
  });
  assert.equal(outsider.allowed, false);

  await portfolio.reviewCertification({
    certificationId: "cert_3", reviewerId: "usr_cdc",
    reviewerInstitutionId: "inst_gcet", approve: true,
  });

  const after = await portfolio.canReadDocument("doc_cert_sql", {
    id: "usr_cdc", role: "institution", institutionId: "inst_gcet",
  });
  assert.equal(after.allowed, false, "the grant must lapse once the claim leaves the queue");
});

test("only the student's own institution can rule on their certification", async () => {
  const cert = await portfolio.addCertification({
    userId: "usr_priya", name: "Kubernetes Administrator", issuer: "CNCF",
    issuedOn: new Date().toISOString(), skillIds: [], documentId: "doc_cert_sql",
  });
  assert.equal(cert.verificationStatus, "pending", "evidence puts a claim in the queue");

  const foreign = await portfolio.reviewCertification({
    certificationId: cert.id, reviewerId: "usr_other",
    reviewerInstitutionId: "inst_svnit", approve: true,
  });
  assert.equal(foreign, null);

  const rejected = await portfolio.reviewCertification({
    certificationId: cert.id, reviewerId: "usr_cdc",
    reviewerInstitutionId: "inst_gcet", approve: false, note: "Issuer could not be confirmed.",
  });
  assert.equal(rejected?.verified, false);
  assert.equal(rejected?.verificationStatus, "rejected");

  // A verdict is final until the student resubmits — no double review.
  const again = await portfolio.reviewCertification({
    certificationId: cert.id, reviewerId: "usr_cdc",
    reviewerInstitutionId: "inst_gcet", approve: true,
  });
  assert.equal(again, null);
});

test("a certification with no evidence never enters the review queue", async () => {
  const cert = await portfolio.addCertification({
    userId: "usr_priya", name: "Self-study: Rust", issuer: "Independent",
    issuedOn: new Date().toISOString(), skillIds: [],
  });
  assert.equal(cert.verificationStatus, "unverified");
  const queue = await portfolio.listPendingCertifications("inst_gcet");
  assert.ok(queue.every((entry) => entry.certification.id !== cert.id));
});

test("the review queue only shows this institution's own students", async () => {
  const mine = await portfolio.addCertification({
    userId: "usr_priya", name: "Terraform Associate", issuer: "HashiCorp",
    issuedOn: new Date().toISOString(), skillIds: [], documentId: "doc_cert_sql",
  });
  const theirs = await portfolio.addCertification({
    userId: "usr_kavya", name: "Burp Suite Practitioner", issuer: "PortSwigger",
    issuedOn: new Date().toISOString(), skillIds: [], documentId: "doc_3",
  });

  const gcet = await portfolio.listPendingCertifications("inst_gcet");
  assert.ok(gcet.some((entry) => entry.certification.id === mine.id), "Priya is enrolled at GCET");
  assert.ok(gcet.every((entry) => entry.certification.id !== theirs.id), "Kavya is enrolled at SVNIT");
});

test("a missing document is reported the same way as a forbidden one at the route", async () => {
  const verdict = await portfolio.canReadDocument("doc_does_not_exist", { id: "usr_priya", role: "student" });
  assert.equal(verdict.allowed, false);
});

test("a student cannot apply to a faculty-only programme", async () => {
  const result = await opportunities.applyToProgram({
    programId: "col_fdp_ai", applicantId: "usr_priya", applicantRole: "student",
  });
  assert.ok("error" in result && result.error === "forbidden");
});

test("a faculty member can apply to a faculty programme, but only once", async () => {
  const first = await opportunities.applyToProgram({
    programId: "col_faculty_intern", applicantId: "usr_faculty", applicantRole: "faculty",
  });
  assert.ok(!("error" in first));

  const second = await opportunities.applyToProgram({
    programId: "col_faculty_intern", applicantId: "usr_faculty", applicantRole: "faculty",
  });
  assert.ok("error" in second && second.error === "duplicate");
});

test("a recruiter cannot advance an application on someone else's posting", async () => {
  const result = await opportunities.advanceApplication(
    "app_5", "rejected", "usr_recruiter", "org_nimbus",
  );
  assert.equal(result, undefined, "must refuse: app_5 belongs to an Axiom posting");
});

test("a recruiter cannot advance an application on another employer's posting", async () => {
  // app_2 is against a Vertex posting, not a Nimbus one.
  const result = await opportunities.advanceApplication(
    "app_2", "shortlisted", "usr_recruiter", "org_nimbus",
  );
  assert.equal(result, undefined);
});

test("a recruiter can advance an application on their own posting", async () => {
  const result = await opportunities.advanceApplication(
    "app_7", "shortlisted", "usr_recruiter", "org_nimbus",
  );
  assert.equal(result?.stage, "shortlisted");
  assert.equal(result?.timeline.at(-1)?.stage, "shortlisted");
});

test("a student cannot withdraw someone else's application", async () => {
  assert.equal(await opportunities.withdrawApplication("app_4", "usr_priya"), false);
  assert.equal(await opportunities.withdrawApplication("app_3", "usr_priya"), true);
});

test("closing a posting requires owning it", async () => {
  assert.equal(await opportunities.setOpportunityStatus("opp_secanalyst", "org_nimbus", "closed"), false);
  assert.equal(await opportunities.setOpportunityStatus("opp_backend_intern", "org_nimbus", "closed"), true);
});

test("applicant listings are scoped to the employer's own postings", async () => {
  const nimbus = await opportunities.listApplicationsForOrganization("org_nimbus");
  const axiom = await opportunities.listApplicationsForOrganization("org_axiom");
  assert.ok(nimbus.every((a) => a.opportunityId !== "opp_secanalyst"));
  assert.ok(axiom.every((a) => a.opportunityId === "opp_secanalyst"));
});

test("a training programme is published under the recruiter's own organisation", async () => {
  const program = await opportunities.createTrainingProgram({
    organizationId: "org_nimbus",
    postedByUserId: "usr_recruiter",
    title: "Kubernetes in Production",
    description: "Six weeks of live cluster work.",
    kind: "certification",
    domainIds: ["cloud"],
    skillIds: ["cloud_kubernetes"],
    level: "intermediate",
    durationWeeks: 6,
    mode: "cohort",
    certificateOffered: true,
    seats: 60,
    startsOn: new Date().toISOString(),
    status: "open",
  });

  // Another employer's programme listing must not include it.
  const axiom = await opportunities.listTrainingPrograms({ organizationId: "org_axiom" });
  assert.ok(axiom.every((t) => t.id !== program.id));
  const nimbus = await opportunities.listTrainingPrograms({ organizationId: "org_nimbus" });
  assert.ok(nimbus.some((t) => t.id === program.id));
});

test("enrolling in a training programme is idempotent and refuses closed ones", async () => {
  const open = await opportunities.createTrainingProgram({
    organizationId: "org_nimbus", postedByUserId: "usr_recruiter",
    title: "Observability Clinic", description: "Two weeks on tracing and SLOs.",
    kind: "workshop", domainIds: ["cloud"], skillIds: ["cloud_observability"],
    level: "intermediate", durationWeeks: 2, mode: "live", certificateOffered: false,
    seats: 30, startsOn: new Date().toISOString(), status: "open",
  });
  const closed = await opportunities.createTrainingProgram({
    organizationId: "org_nimbus", postedByUserId: "usr_recruiter",
    title: "Retired Track", description: "No longer running for new cohorts.",
    kind: "training", domainIds: ["cloud"], skillIds: ["cloud_cicd"],
    level: "beginner", durationWeeks: 1, mode: "self_paced", certificateOffered: false,
    seats: 10, startsOn: new Date().toISOString(), status: "closed",
  });

  const first = await opportunities.enrollInTraining("usr_priya", open.id);
  const second = await opportunities.enrollInTraining("usr_priya", open.id);
  assert.ok(first);
  assert.equal(second?.id, first?.id, "enrolling twice must not create a second seat");
  assert.equal(await opportunities.enrollInTraining("usr_priya", closed.id), null);
});

test("enrolling in more domains never removes the existing ones", async () => {
  const before = (await users.getStudentProfile("usr_priya"))!.enrollments.map((e) => e.domainId);
  assert.ok(before.includes("fullstack"));

  await learning.enrollDomains("usr_priya", [{ domainId: "cybersecurity", level: "beginner" }]);
  const after = (await users.getStudentProfile("usr_priya"))!.enrollments.map((e) => e.domainId);

  for (const domainId of before) assert.ok(after.includes(domainId), `${domainId} must survive`);
  assert.ok(after.includes("cybersecurity"));
});

test("a completed domain stays completed while others carry on", async () => {
  const profile = (await users.getStudentProfile("usr_priya"))!;
  const completed = profile.enrollments.find((e) => e.domainId === "data-science");
  const inProgress = profile.enrollments.find((e) => e.domainId === "fullstack");

  assert.equal(completed?.status, "completed");
  assert.equal(completed?.progress, 100);
  assert.equal(inProgress?.status, "in_progress");
  assert.ok((inProgress?.progress ?? 0) < 100);
});

test("re-declaring a level clears the previous placement so the diagnostic reruns", async () => {
  await learning.enrollDomains("usr_priya", [{ domainId: "cybersecurity", level: "advanced" }]);
  const enrollment = await learning.getEnrollment("usr_priya", "cybersecurity");
  assert.equal(enrollment?.declaredLevel, "advanced");
  assert.equal(enrollment?.placedLevel, null);
});

test("grading happens server-side and folds into the skill matrix", async () => {
  const assessment = await learning.createAssessment("usr_arjun", "cloud", "intermediate", 6);
  assert.ok(assessment.questionIds.length > 0);

  const { getQuestion } = await import("../src/lib/domain/questions");
  const perfect = Object.fromEntries(
    assessment.questionIds.map((id) => [id, getQuestion(id)!.correctIndex]),
  );

  const result = await learning.gradeAssessment(assessment, perfect);
  assert.equal(result.scorePercent, 100);
  // Declared intermediate, so the ceiling is the intermediate track however
  // well the paper is answered.
  assert.equal(result.placedLevel, "intermediate");

  const profile = await users.getStudentProfile("usr_arjun");
  assert.ok(Object.keys(result.skillScores).length > 0);
  for (const skillId of Object.keys(result.skillScores)) {
    assert.equal(profile?.skillMatrix[skillId]?.source, "assessment");
  }
});

test("a wrong-answer submission places the learner back at the beginning", async () => {
  const assessment = await learning.createAssessment("usr_kavya", "ml", "advanced", 6);
  const { getQuestion } = await import("../src/lib/domain/questions");
  const wrong = Object.fromEntries(
    assessment.questionIds.map((id) => {
      const question = getQuestion(id)!;
      return [id, (question.correctIndex + 1) % question.options.length];
    }),
  );

  const result = await learning.gradeAssessment(assessment, wrong);
  assert.equal(result.scorePercent, 0);
  assert.equal(result.placedLevel, "beginner");
});

test("a streak counts a day once, however much activity happens", async () => {
  const first = await learning.recordActivity("usr_kavya", "module_completed", "cybersecurity");
  const second = await learning.recordActivity("usr_kavya", "quiz_completed", "cybersecurity");
  assert.equal(first.current, second.current, "same-day activity must not inflate the streak");

  const today = new Date().toISOString().slice(0, 10);
  assert.ok((second.history[today] ?? 0) >= 2, "but every activity is still recorded");
});

test("a lapsed streak reads as broken", async () => {
  // Kavya's seeded last activity was days ago; recording today restarts at 1.
  const streak = await learning.getStreak("usr_kavya");
  assert.equal(streak.current, 1);
  assert.ok(streak.longest >= streak.current);
});
