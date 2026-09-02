import "server-only";
import { RuleSkillEngine } from "./rule-engine";
import type { SkillEngine } from "./types";

export type { SkillEngine, EngineContext, OpportunityMatch, CareerRecommendation, AdvisorAnswer } from "./types";

/**
 * Engine selection.
 *
 * `AI_PROVIDER` is read on the server only. Adding a model-backed engine means
 * adding a branch here that returns an object implementing `SkillEngine` — the
 * rest of the app is already written against the interface, and no provider
 * credential is ever referenced outside this module.
 */
let cached: SkillEngine | null = null;

export function getSkillEngine(): SkillEngine {
  if (cached) return cached;
  const provider = (process.env.AI_PROVIDER ?? "mock").toLowerCase();
  switch (provider) {
    case "mock":
    case "rule":
    default:
      cached = new RuleSkillEngine();
      return cached;
  }
}
