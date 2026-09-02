import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_PLACEMENT_POLICY, placeLearner, requiresDiagnostic } from "../src/lib/domain/placement";
import { buildDiagnostic, questionsForDomain, toClientQuestion } from "../src/lib/domain/questions";
import { DOMAIN_IDS } from "../src/lib/domain/domains";

test("beginners skip the diagnostic, everyone else takes one", () => {
  assert.equal(requiresDiagnostic("beginner"), false);
  assert.equal(requiresDiagnostic("intermediate"), true);
  assert.equal(requiresDiagnostic("advanced"), true);
});

test("a declared level is a hypothesis, not a verdict", () => {
  // 0% starts over regardless of what the learner claimed.
  assert.equal(placeLearner("advanced", 0).level, "beginner");
  assert.equal(placeLearner("intermediate", 0).level, "beginner");

  // Roughly half lands mid-track.
  assert.equal(placeLearner("advanced", 50).level, "intermediate");
  assert.equal(placeLearner("intermediate", 55).level, "intermediate");

  // Demonstrated mastery confirms the advanced track.
  assert.equal(placeLearner("advanced", 100).level, "advanced");

  // An intermediate paper cannot evidence advanced competence, however well it
  // is answered — the ceiling for that test is the intermediate track.
  assert.equal(placeLearner("intermediate", 95).level, "intermediate");
  assert.equal(placeLearner("intermediate", 100).level, "intermediate");
});

test("beginners are always placed at beginner", () => {
  for (const score of [0, 50, 100]) {
    assert.equal(placeLearner("beginner", score).level, "beginner");
  }
});

test("thresholds are configurable without changing call sites", () => {
  const strict = {
    ...DEFAULT_PLACEMENT_POLICY,
    bands: {
      ...DEFAULT_PLACEMENT_POLICY.bands,
      advanced: [
        { minScore: 95, level: "advanced" as const, label: "Advanced" },
        { minScore: 0, level: "beginner" as const, label: "Beginner" },
      ],
    },
  };
  assert.equal(placeLearner("advanced", 90, strict).level, "beginner");
  assert.equal(placeLearner("advanced", 96, strict).level, "advanced");
});

test("each domain has its own question bank", () => {
  for (const domainId of DOMAIN_IDS) {
    const bank = questionsForDomain(domainId);
    assert.ok(bank.length >= 8, `${domainId} needs a usable bank, got ${bank.length}`);
    assert.ok(bank.every((q) => q.domainId === domainId));
  }
});

test("a diagnostic never mixes domains and spreads across skills", () => {
  const diagnostic = buildDiagnostic("cybersecurity", "advanced", 10);
  assert.ok(diagnostic.length > 0);
  assert.ok(diagnostic.every((q) => q.domainId === "cybersecurity"));
  assert.ok(new Set(diagnostic.map((q) => q.skillId)).size >= 4, "should probe several skills");
});

test("intermediate diagnostics exclude advanced-only items", () => {
  const diagnostic = buildDiagnostic("fullstack", "intermediate", 10);
  assert.ok(diagnostic.every((q) => q.level !== "advanced"));
});

test("the answer key never leaves the server", () => {
  const question = questionsForDomain("ml")[0];
  const client = toClientQuestion(question) as Record<string, unknown>;
  assert.equal(client.correctIndex, undefined);
  assert.equal(client.explanation, undefined);
  assert.ok(Array.isArray(client.options));
});

test("every question's correct answer is a real option", () => {
  for (const domainId of DOMAIN_IDS) {
    for (const question of questionsForDomain(domainId)) {
      assert.ok(
        question.correctIndex >= 0 && question.correctIndex < question.options.length,
        `${question.id} has an out-of-range answer key`,
      );
    }
  }
});
