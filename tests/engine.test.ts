import test from "node:test";
import assert from "node:assert/strict";
import { RuleSkillEngine } from "../src/lib/ai/rule-engine";
import { MODULES } from "../src/lib/domain/curriculum";
import type { EngineContext } from "../src/lib/ai/types";
import type { Opportunity, SkillSignal, StudentProfile } from "../src/lib/types";

const engine = new RuleSkillEngine();

function signal(skillId: string, score: number): SkillSignal {
  return {
    skillId, score,
    strength: score >= 75 ? "strong" : score >= 45 ? "developing" : "weak",
    source: "assessment", verified: false, updatedAt: new Date().toISOString(),
  };
}

function context(overrides: Partial<EngineContext> = {}): EngineContext {
  const skillMatrix: Record<string, SkillSignal> = {
    html: signal("html", 88), css: signal("css", 82), javascript: signal("javascript", 58),
    dom: signal("dom", 61), "async-js": signal("async-js", 47), react: signal("react", 34),
    "rest-apis": signal("rest-apis", 38), auth: signal("auth", 26), databases: signal("databases", 55),
  };

  const profile: StudentProfile = {
    userId: "usr_test", institutionName: "Test College", degree: "B.Tech",
    branch: "Computer Engineering", graduationYear: new Date().getFullYear() + 1, cgpa: 8.0,
    careerInterests: ["Frontend Developer"],
    enrollments: [{
      domainId: "fullstack", declaredLevel: "intermediate", placedLevel: "intermediate",
      placementScore: 62, status: "in_progress", progress: 20, enrolledAt: new Date().toISOString(),
    }],
    skillMatrix, updatedAt: new Date().toISOString(),
  };

  return {
    profile, skillMatrix, results: [], progress: [], modules: MODULES,
    marketRequirements: [], ...overrides,
  };
}

function opportunity(overrides: Partial<Opportunity> = {}): Opportunity {
  return {
    id: "opp_test", type: "internship", organizationId: "org_test", postedByUserId: "usr_r",
    title: "Frontend Developer Intern", description: "Build interfaces.",
    location: "Remote", workMode: "remote", domainIds: ["fullstack"],
    requirements: [
      { skillId: "react", minimumScore: 60, weight: 2, mandatory: true },
      { skillId: "javascript", minimumScore: 65, weight: 2, mandatory: true },
      { skillId: "rest-apis", minimumScore: 45, weight: 1.5, mandatory: false },
      { skillId: "html", minimumScore: 60, weight: 1, mandatory: false },
    ],
    eligibility: {
      degrees: ["B.Tech"], branches: ["Computer Engineering"],
      graduationYears: [new Date().getFullYear() + 1], minCgpa: 6.5,
    },
    openings: 4, deadline: new Date(Date.now() + 86_400_000).toISOString(),
    status: "open", createdAt: new Date().toISOString(), ...overrides,
  };
}

test("the gap report separates strengths from what actually needs work", () => {
  const report = engine.analyseSkillGap("fullstack", context());

  const names = (list: Array<{ skillId: string }>) => list.map((e) => e.skillId);
  assert.ok(names(report.strong).includes("html"));
  assert.ok(names(report.strong).includes("css"));
  assert.ok(names(report.needsImprovement).includes("react"));
  assert.ok(names(report.needsImprovement).includes("auth"));
  assert.ok(names(report.developing).includes("javascript"));

  // Skills with no evidence at all are reported separately, not as weaknesses.
  assert.ok(names(report.missing).includes("typescript"));
  assert.ok(report.readinessScore > 0 && report.readinessScore < 100);
  assert.match(report.summary, /Full Stack Development/);
});

test("readiness rises as skills improve", () => {
  const weak = engine.analyseSkillGap("fullstack", context()).readinessScore;

  const strongMatrix = Object.fromEntries(
    Object.keys(context().skillMatrix).map((id) => [id, signal(id, 90)]),
  );
  const strong = engine.analyseSkillGap(
    "fullstack",
    context({ skillMatrix: strongMatrix }),
  ).readinessScore;

  assert.ok(strong > weak, `expected ${strong} > ${weak}`);
});

test("required levels rise with market demand", () => {
  const base = engine.analyseSkillGap("fullstack", context());
  const withDemand = engine.analyseSkillGap(
    "fullstack",
    context({ marketRequirements: [opportunity(), opportunity({ id: "opp_2" })] }),
  );

  const reactBase = [...base.strong, ...base.developing, ...base.needsImprovement, ...base.missing]
    .find((e) => e.skillId === "react")!;
  const reactDemand = [...withDemand.strong, ...withDemand.developing, ...withDemand.needsImprovement, ...withDemand.missing]
    .find((e) => e.skillId === "react")!;

  assert.ok(reactDemand.requiredScore > reactBase.requiredScore);
});

test("the path skips demonstrated content and explains why", () => {
  const path = engine.buildLearningPath("fullstack", "intermediate", context());

  const html = path.steps.find((s) => s.moduleId === "fs-html");
  assert.equal(html?.status, "skip");
  assert.match(html!.rationale, /already demonstrates|already completed/i);

  // React is weak, so it must be recommended rather than skipped.
  const react = path.steps.find((s) => s.moduleId === "fs-react");
  assert.notEqual(react?.status, "skip");
  assert.match(react!.rationale, /React|gap|track/i);
});

test("completed modules are skipped and never re-recommended", () => {
  const path = engine.buildLearningPath(
    "fullstack",
    "intermediate",
    context({
      progress: [{
        id: "p1", userId: "usr_test", domainId: "fullstack", moduleId: "fs-js",
        status: "completed", percent: 100, updatedAt: new Date().toISOString(),
      }],
    }),
  );

  const js = path.steps.find((s) => s.moduleId === "fs-js");
  assert.equal(js?.status, "skip");
  assert.match(js!.rationale, /already completed/i);
});

test("a path never contains modules from another domain", () => {
  const path = engine.buildLearningPath("cybersecurity", "beginner", context());
  const ids = new Set(MODULES.filter((m) => m.domainId === "cybersecurity").map((m) => m.id));
  assert.ok(path.steps.length > 0);
  assert.ok(path.steps.every((s) => ids.has(s.moduleId)));
});

test("matching reports a verdict per requirement, not just a score", () => {
  const match = engine.matchOpportunity(opportunity(), context());

  assert.equal(match.breakdown.length, 4);
  // html 88 vs 60 required -> met.
  assert.equal(match.breakdown.find((b) => b.skillId === "html")?.verdict, "met");
  // rest-apis 38 vs 45 required -> within the 60% partial band.
  assert.equal(match.breakdown.find((b) => b.skillId === "rest-apis")?.verdict, "partial");
  // react 34 vs 60 required -> below the partial band, so genuinely missing.
  assert.equal(match.breakdown.find((b) => b.skillId === "react")?.verdict, "missing");
  assert.ok(match.matchScore > 0 && match.matchScore < 100);
});

test("a missing skill is reported as missing, not partial", () => {
  const match = engine.matchOpportunity(
    opportunity({
      requirements: [{ skillId: "kubernetes", minimumScore: 60, weight: 1, mandatory: true }],
    }),
    context(),
  );
  assert.equal(match.breakdown[0].verdict, "missing");
  assert.equal(match.matchScore, 0);
});

test("eligibility rules are evaluated and explained", () => {
  const eligible = engine.matchOpportunity(opportunity(), context());
  assert.equal(eligible.eligible, true);
  assert.deepEqual(eligible.ineligibleReasons, []);

  const wrongBranch = engine.matchOpportunity(
    opportunity({
      eligibility: { degrees: [], branches: ["Mechanical"], graduationYears: [] },
    }),
    context(),
  );
  assert.equal(wrongBranch.eligible, false);
  assert.match(wrongBranch.ineligibleReasons[0], /Mechanical/);

  const cgpaBar = engine.matchOpportunity(
    opportunity({ eligibility: { degrees: [], branches: [], graduationYears: [], minCgpa: 9.5 } }),
    context(),
  );
  assert.equal(cgpaBar.eligible, false);
  assert.match(cgpaBar.ineligibleReasons[0], /CGPA/);
});

test("career recommendations are ranked and carry their reasoning", () => {
  const careers = engine.recommendCareers(context());
  assert.ok(careers.length >= 5);
  for (let i = 1; i < careers.length; i++) {
    assert.ok(careers[i - 1].fitScore >= careers[i].fitScore, "must be sorted by fit");
  }
  assert.ok(careers.every((c) => c.reason.length > 10));
});

test("the advisor answers from the learner's own data", () => {
  const ctx = context();

  const next = engine.advise("What should I learn next?", ctx);
  assert.match(next.answer, /React|Authentication|APIs|TypeScript|Testing/);
  assert.ok(next.suggestedActions.length > 0);

  const ready = engine.advise("Am I ready for a frontend internship?", ctx);
  assert.match(ready.answer, /readiness|Not quite|Yes/i);

  const missing = engine.advise("What skills am I missing for this job?", ctx);
  assert.ok(missing.bullets.length > 0);

  const career = engine.advise("Which career path suits my current skill profile?", ctx);
  assert.match(career.answer, /fit/i);
});

test("advisor confidence reflects the evidence available", () => {
  const noEvidence = engine.advise("What should I learn next?", context());
  assert.equal(noEvidence.confidence, "medium");

  const withResults = engine.advise("What should I learn next?", context({
    results: [{
      id: "res_1", assessmentId: "asm_1", userId: "usr_test", domainId: "fullstack",
      scorePercent: 62, correctCount: 6, totalCount: 10,
      declaredLevel: "intermediate", placedLevel: "intermediate",
      skillScores: { react: 30 }, createdAt: new Date().toISOString(),
    }],
  }));
  assert.equal(withResults.confidence, "high");
});
