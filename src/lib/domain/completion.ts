import type { LearningPath, LearningModule } from "@/lib/types";

/**
 * How far through a domain a learner is.
 *
 * The subtlety: the recommendation engine marks a module `skip` for two very
 * different reasons — "you already completed this" and "your assessment already
 * demonstrates this". Only the second should leave the denominator. Dropping
 * completed modules too would remove them from the numerator as well, so
 * finishing work would never move the number.
 *
 * Both the progress writer and the dashboard read this one function, so the
 * percentage and the "x of y modules" caption can never disagree.
 */
export interface DomainCompletion {
  /** Modules that count toward completion, in path order. */
  requiredModuleIds: string[];
  /** Of those, the ones the learner has finished. */
  completedModuleIds: string[];
  /** Skipped purely on demonstrated competency — excluded from the maths. */
  skippedModuleIds: string[];
  percent: number;
}

export function computeDomainCompletion(
  path: LearningPath | undefined,
  domainModules: LearningModule[],
  completed: ReadonlySet<string>,
): DomainCompletion {
  // Without a generated path, every module in the domain counts.
  const steps = path
    ? path.steps
    : domainModules.map((m) => ({ moduleId: m.id, status: "recommended" as const, order: m.order, rationale: "" }));

  const requiredModuleIds: string[] = [];
  const skippedModuleIds: string[] = [];

  for (const step of steps) {
    if (step.status === "skip" && !completed.has(step.moduleId)) {
      skippedModuleIds.push(step.moduleId);
      continue;
    }
    requiredModuleIds.push(step.moduleId);
  }

  const completedModuleIds = requiredModuleIds.filter((id) => completed.has(id));
  const percent = requiredModuleIds.length === 0
    ? 0
    : Math.round((completedModuleIds.length / requiredModuleIds.length) * 100);

  return { requiredModuleIds, completedModuleIds, skippedModuleIds, percent };
}
