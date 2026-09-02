import test from "node:test";
import assert from "node:assert/strict";
import { checkPasswordStrength, hashPassword, verifyPassword } from "../src/lib/auth/password";
import { createSessionToken, verifySessionToken } from "../src/lib/auth/session";
import { canAccess, homeFor, roleForPath } from "../src/lib/auth/roles";
import { consume } from "../src/lib/auth/rate-limit";

test("passwords are salted, so identical inputs hash differently", async () => {
  const a = await hashPassword("Correct-Horse-9");
  const b = await hashPassword("Correct-Horse-9");
  assert.notEqual(a, b);
  assert.ok(a.startsWith("scrypt$"));
  assert.ok(!a.includes("Correct-Horse-9"));
});

test("verification accepts the right password and rejects the wrong one", async () => {
  const stored = await hashPassword("Correct-Horse-9");
  assert.equal(await verifyPassword("Correct-Horse-9", stored), true);
  assert.equal(await verifyPassword("correct-horse-9", stored), false);
  assert.equal(await verifyPassword("", stored), false);
});

test("a malformed hash fails closed rather than throwing", async () => {
  assert.equal(await verifyPassword("anything", "not-a-hash"), false);
  assert.equal(await verifyPassword("anything", ""), false);
});

test("weak passwords are rejected with actionable reasons", () => {
  assert.equal(checkPasswordStrength("short").ok, false);
  assert.equal(checkPasswordStrength("password").ok, false);
  assert.equal(checkPasswordStrength("alllowercase123").ok, false);
  assert.equal(checkPasswordStrength("Str0ng-Passphrase").ok, true);
});

test("session tokens round-trip and reject tampering", async () => {
  const token = await createSessionToken({
    sub: "usr_1", name: "Priya", roles: ["student"], activeRole: "student", onboardingComplete: true,
  });

  const payload = await verifySessionToken(token);
  assert.equal(payload?.sub, "usr_1");
  assert.deepEqual(payload?.roles, ["student"]);

  // Flipping a character in the signature must invalidate the token.
  const tampered = token.slice(0, -2) + (token.endsWith("a") ? "b" : "a");
  assert.equal(await verifySessionToken(tampered), null);
  assert.equal(await verifySessionToken(undefined), null);
  assert.equal(await verifySessionToken("garbage"), null);
});

test("an expired token is not accepted", async () => {
  const token = await createSessionToken(
    { sub: "usr_1", name: "Priya", roles: ["student"], activeRole: "student", onboardingComplete: true },
    -10,
  );
  assert.equal(await verifySessionToken(token), null);
});

test("role grants do not leak across roles", () => {
  const student = ["student" as const];
  assert.equal(canAccess(student, "student"), true);
  assert.equal(canAccess(student, "faculty"), false);
  assert.equal(canAccess(student, "industry"), false);
  assert.equal(canAccess(student, "institution"), false);
  assert.equal(canAccess(student, "admin"), false);

  // Admin is not a superuser over the other role areas either.
  const admin = ["admin" as const];
  assert.equal(canAccess(admin, "admin"), true);
  assert.equal(canAccess(admin, "student"), false);
});

test("paths map to the role that owns them", () => {
  assert.equal(roleForPath("/student/dashboard"), "student");
  assert.equal(roleForPath("/institution/analytics"), "institution");
  assert.equal(roleForPath("/industry/applicants"), "industry");
  assert.equal(roleForPath("/faculty/fdp"), "faculty");
  assert.equal(roleForPath("/admin/audit"), "admin");
  assert.equal(roleForPath("/login"), null);
  // A prefix collision must not grant access.
  assert.equal(roleForPath("/studentsomething"), null);
});

test("users land in their own workspace", () => {
  assert.equal(homeFor(["student"], "student"), "/student/dashboard");
  assert.equal(homeFor(["faculty"], null), "/faculty/dashboard");
  assert.equal(homeFor([], null), "/onboarding/role");
});

test("rate limiting blocks a burst and reports a retry window", () => {
  const key = `test-${Math.random()}`;
  const rule = { limit: 3, windowMs: 60_000 };
  assert.equal(consume(key, rule).allowed, true);
  assert.equal(consume(key, rule).allowed, true);
  assert.equal(consume(key, rule).allowed, true);

  const blocked = consume(key, rule);
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfterSeconds > 0);
});
