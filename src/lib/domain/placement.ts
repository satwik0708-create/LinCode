import type { LearningLevel } from "@/lib/types";

/**
 * Placement thresholds.
 *
 * The student's declared level is a hint, not a verdict — the diagnostic score
 * decides where they actually start. Thresholds are data, not branching logic,
 * so a future scoring model (per-skill, IRT, partial credit) can replace the
 * numbers without touching callers.
 */
export interface PlacementBand {
  /** Inclusive lower bound of the score band, 0-100. */
  minScore: number;
  level: LearningLevel;
  label: string;
}

export interface PlacementPolicy {
  /** Declared level -> ordered bands, highest threshold first. */
  bands: Record<LearningLevel, PlacementBand[]>;
  /** Levels that skip the diagnostic entirely. */
  skipDiagnostic: LearningLevel[];
  questionCount: number;
}

export const DEFAULT_PLACEMENT_POLICY: PlacementPolicy = {
  skipDiagnostic: ["beginner"],
  questionCount: 10,
  bands: {
    // Beginners are taken at their word and start at the beginning.
    beginner: [{ minScore: 0, level: "beginner", label: "Beginner track" }],

    // "I've learned some of this" — prove it, or start over.
    intermediate: [
      { minScore: 85, level: "advanced", label: "Advanced track" },
      { minScore: 40, level: "intermediate", label: "Intermediate track" },
      { minScore: 0, level: "beginner", label: "Beginner track" },
    ],

    // "I finished the content but don't have a grip on it" —
    // 0% starts over, ~50% lands mid-track, near-perfect confirms advanced.
    advanced: [
      { minScore: 85, level: "advanced", label: "Advanced track" },
      { minScore: 45, level: "intermediate", label: "Intermediate track" },
      { minScore: 0, level: "beginner", label: "Beginner track" },
    ],
  },
};

export function requiresDiagnostic(
  level: LearningLevel,
  policy: PlacementPolicy = DEFAULT_PLACEMENT_POLICY,
): boolean {
  return !policy.skipDiagnostic.includes(level);
}

export function placeLearner(
  declaredLevel: LearningLevel,
  scorePercent: number,
  policy: PlacementPolicy = DEFAULT_PLACEMENT_POLICY,
): { level: LearningLevel; label: string } {
  const bands = policy.bands[declaredLevel] ?? policy.bands.beginner;
  const score = Math.max(0, Math.min(100, scorePercent));
  const band = bands.find((b) => score >= b.minScore) ?? bands[bands.length - 1];
  return { level: band.level, label: band.label };
}

export function placementExplanation(
  declaredLevel: LearningLevel,
  placedLevel: LearningLevel,
  score: number,
): string {
  if (declaredLevel === placedLevel) {
    return `You scored ${score}%, which confirms the ${placedLevel} level you selected. Your path starts there.`;
  }
  const rank: Record<LearningLevel, number> = { beginner: 0, intermediate: 1, advanced: 2 };
  if (rank[placedLevel] < rank[declaredLevel]) {
    return `You scored ${score}%. Rather than leaving gaps behind you, we've placed you on the ${placedLevel} track — modules you already know are marked as skippable so you won't repeat them.`;
  }
  return `You scored ${score}%, above what the ${declaredLevel} track covers. We've moved you up to the ${placedLevel} track.`;
}
