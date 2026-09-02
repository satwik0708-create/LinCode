import { getDomain, LEARNING_DOMAINS } from "@/lib/domain/domains";
import { skillName, skillsForDomain } from "@/lib/domain/skills";
import type {
  LearningLevel, LearningPath, LearningPathStep, Opportunity,
  SkillGapEntry, SkillGapReport,
} from "@/lib/types";
import type {
  AdvisorAnswer, CareerRecommendation, EngineContext, OpportunityMatch, SkillEngine,
} from "./types";

/**
 * Deterministic recommendation engine.
 *
 * Everything here is explainable: each recommendation carries the reason it was
 * produced, which is what makes the output usable in a student-facing product.
 * It implements the same `SkillEngine` interface a model-backed engine would.
 */

const LEVEL_RANK: Record<LearningLevel, number> = { beginner: 0, intermediate: 1, advanced: 2 };

/** Competency a domain expects of a skill at each track level. */
const TARGET_BY_LEVEL: Record<LearningLevel, number> = { beginner: 45, intermediate: 65, advanced: 80 };

function scoreFor(ctx: EngineContext, skillId: string): number {
  return ctx.skillMatrix[skillId]?.score ?? 0;
}

/** How often a skill appears across open postings, normalised to 0-100. */
function marketWeight(ctx: EngineContext, skillId: string): number {
  if (ctx.marketRequirements.length === 0) return 0;
  const mentions = ctx.marketRequirements.filter((o) =>
    o.requirements.some((r) => r.skillId === skillId),
  ).length;
  return Math.round((mentions / ctx.marketRequirements.length) * 100);
}

export class RuleSkillEngine implements SkillEngine {
  readonly name = "rule-engine-v1";

  analyseSkillGap(domainId: string, ctx: EngineContext): SkillGapReport {
    const domain = getDomain(domainId);
    const enrollment = ctx.profile.enrollments.find((e) => e.domainId === domainId);
    const level: LearningLevel = enrollment?.placedLevel ?? enrollment?.declaredLevel ?? "beginner";
    const baseTarget = TARGET_BY_LEVEL[level];

    const skills = domain ? domain.skillIds : skillsForDomain(domainId).map((s) => s.id);

    const entries: SkillGapEntry[] = skills.map((skillId) => {
      const current = scoreFor(ctx, skillId);
      // Skills the market asks for loudly are held to a higher bar.
      const demand = marketWeight(ctx, skillId);
      const required = Math.min(95, baseTarget + Math.round(demand * 0.15));
      const gap = Math.max(0, required - current);
      return {
        skillId,
        skillName: skillName(skillId),
        currentScore: current,
        requiredScore: required,
        gap,
        strength: current >= 75 ? "strong" : current >= 45 ? "developing" : current > 0 ? "weak" : "unknown",
      };
    });

    const strong = entries.filter((e) => e.currentScore >= 75).sort((a, b) => b.currentScore - a.currentScore);
    const developing = entries.filter((e) => e.currentScore >= 45 && e.currentScore < 75).sort((a, b) => b.currentScore - a.currentScore);
    const needsImprovement = entries.filter((e) => e.currentScore > 0 && e.currentScore < 45).sort((a, b) => b.gap - a.gap);
    const missing = entries.filter((e) => e.currentScore === 0).sort((a, b) => b.requiredScore - a.requiredScore);

    const totalRequired = entries.reduce((sum, e) => sum + e.requiredScore, 0);
    const totalHeld = entries.reduce((sum, e) => sum + Math.min(e.currentScore, e.requiredScore), 0);
    const readinessScore = totalRequired === 0 ? 0 : Math.round((totalHeld / totalRequired) * 100);

    const summary = buildGapSummary(domain?.name ?? domainId, readinessScore, strong, needsImprovement, missing);

    return {
      userId: ctx.profile.userId,
      domainId,
      generatedAt: new Date().toISOString(),
      strong, developing, needsImprovement, missing,
      readinessScore,
      summary,
    };
  }

  buildLearningPath(domainId: string, level: LearningLevel, ctx: EngineContext): LearningPath {
    const modules = ctx.modules
      .filter((m) => m.domainId === domainId)
      .sort((a, b) => a.order - b.order);

    const completed = new Set(
      ctx.progress.filter((p) => p.domainId === domainId && p.status === "completed").map((p) => p.moduleId),
    );

    const steps: LearningPathStep[] = [];
    let order = 0;

    for (const mod of modules) {
      const alreadyDone = completed.has(mod.id);

      // A module is skippable when every skill it teaches is already
      // demonstrated at the level the module targets.
      const target = TARGET_BY_LEVEL[mod.level];
      const skillScores = mod.skillIds.map((id) => scoreFor(ctx, id));
      const weakest = skillScores.length ? Math.min(...skillScores) : 0;
      const demonstrated = skillScores.length > 0 && weakest >= target;

      // Content clearly below the learner's placement is not worth repeating
      // unless the diagnostic actually found a hole in it.
      const belowPlacement = LEVEL_RANK[mod.level] < LEVEL_RANK[level];

      if (alreadyDone) {
        steps.push({
          moduleId: mod.id, order: order++, status: "skip",
          rationale: "You have already completed this module.",
        });
        continue;
      }

      if (demonstrated) {
        const evidence = mod.skillIds.map((id) => `${skillName(id)} ${scoreFor(ctx, id)}%`).join(", ");
        steps.push({
          moduleId: mod.id, order: order++, status: "skip",
          rationale: `Your assessment already demonstrates this (${evidence}).`,
        });
        continue;
      }

      if (belowPlacement && weakest >= target - 15) {
        steps.push({
          moduleId: mod.id, order: order++, status: "skip",
          rationale: `Below your placed ${level} level and close enough on the underlying skills — revisit only if you want the refresher.`,
        });
        continue;
      }

      const unmetPrereq = mod.prerequisiteModuleIds.some(
        (id) => !completed.has(id) && !steps.some((s) => s.moduleId === id && s.status === "skip"),
      );

      const weakSkills = mod.skillIds
        .filter((id) => scoreFor(ctx, id) < target)
        .map((id) => `${skillName(id)} (${scoreFor(ctx, id)}%)`);

      steps.push({
        moduleId: mod.id,
        order: order++,
        status: unmetPrereq ? "locked" : "recommended",
        rationale: unmetPrereq
          ? `Unlocks once you finish ${mod.prerequisiteModuleIds.length > 1 ? "its prerequisites" : "the prerequisite module"}.`
          : weakSkills.length
            ? `Closes your gap in ${weakSkills.slice(0, 3).join(", ")}.`
            : `Next in the ${mod.level} track.`,
      });
    }

    return {
      id: `path_${ctx.profile.userId}_${domainId}`,
      userId: ctx.profile.userId,
      domainId,
      level,
      steps,
      generatedAt: new Date().toISOString(),
    };
  }

  matchOpportunity(opportunity: Opportunity, ctx: EngineContext): OpportunityMatch {
    const breakdown = opportunity.requirements.map((req) => {
      const have = scoreFor(ctx, req.skillId);
      const verdict: "met" | "partial" | "missing" =
        have >= req.minimumScore ? "met" : have >= req.minimumScore * 0.6 ? "partial" : "missing";
      return {
        skillId: req.skillId,
        skillName: skillName(req.skillId),
        required: req.minimumScore,
        have,
        verdict,
        mandatory: req.mandatory,
      };
    });

    const totalWeight = opportunity.requirements.reduce((sum, r) => sum + r.weight, 0) || 1;
    const earned = opportunity.requirements.reduce((sum, r) => {
      const have = scoreFor(ctx, r.skillId);
      const ratio = r.minimumScore === 0 ? 1 : Math.min(1, have / r.minimumScore);
      return sum + ratio * r.weight;
    }, 0);
    const matchScore = Math.round((earned / totalWeight) * 100);

    const ineligibleReasons: string[] = [];
    const { eligibility } = opportunity;
    const profile = ctx.profile;

    if (eligibility.degrees.length && profile.degree && !eligibility.degrees.includes(profile.degree)) {
      ineligibleReasons.push(`Open to ${eligibility.degrees.join(", ")}.`);
    }
    if (eligibility.branches.length && profile.branch && !eligibility.branches.includes(profile.branch)) {
      ineligibleReasons.push(`Open to ${eligibility.branches.join(", ")}.`);
    }
    if (eligibility.graduationYears.length && !eligibility.graduationYears.includes(profile.graduationYear)) {
      ineligibleReasons.push(`Open to the ${eligibility.graduationYears.join(" and ")} graduating batches.`);
    }
    if (eligibility.minCgpa != null && profile.cgpa != null && profile.cgpa < eligibility.minCgpa) {
      ineligibleReasons.push(`Requires a minimum CGPA of ${eligibility.minCgpa}.`);
    }

    return { opportunityId: opportunity.id, matchScore, breakdown, eligible: ineligibleReasons.length === 0, ineligibleReasons };
  }

  recommendCareers(ctx: EngineContext): CareerRecommendation[] {
    const recommendations: CareerRecommendation[] = [];

    for (const domain of LEARNING_DOMAINS) {
      const gap = this.analyseSkillGap(domain.id, ctx);
      const enrolled = ctx.profile.enrollments.some((e) => e.domainId === domain.id);
      const interestBonus = ctx.profile.careerInterests.some((i) =>
        domain.roles.some((r) => r.toLowerCase().includes(i.toLowerCase()) || i.toLowerCase().includes(r.toLowerCase())),
      )
        ? 8
        : 0;

      const fitScore = Math.min(100, gap.readinessScore + (enrolled ? 5 : 0) + interestBonus);
      const missing = [...gap.needsImprovement, ...gap.missing].slice(0, 4).map((e) => e.skillId);

      const primaryRole = domain.roles[0];
      recommendations.push({
        role: primaryRole,
        domainId: domain.id,
        fitScore,
        reason:
          fitScore >= 70
            ? `Your strongest signals (${gap.strong.slice(0, 2).map((s) => s.skillName).join(", ") || "recent modules"}) line up directly with this role.`
            : fitScore >= 45
              ? `A realistic target once you close ${missing.slice(0, 2).map(skillName).join(" and ") || "the remaining gaps"}.`
              : `A longer-term option — the fundamentals for this path are still mostly ahead of you.`,
        missingSkillIds: missing,
        demandIndex: domain.industryDemand,
        medianSalaryLpa: domain.averageSalaryLpa,
      });
    }

    return recommendations.sort((a, b) => b.fitScore - a.fitScore);
  }

  advise(question: string, ctx: EngineContext, domainId?: string): AdvisorAnswer {
    const q = question.toLowerCase();
    const primaryDomain =
      domainId ??
      ctx.profile.enrollments.find((e) => e.status === "in_progress")?.domainId ??
      ctx.profile.enrollments[0]?.domainId ??
      "fullstack";

    const gap = this.analyseSkillGap(primaryDomain, ctx);
    const domain = getDomain(primaryDomain);
    const careers = this.recommendCareers(ctx);

    const asksReadiness = /(ready|prepared|can i apply|good enough|should i apply)/.test(q);
    const asksNext = /(what (should|do) i learn|next|start with|focus on|improve)/.test(q);
    const asksMissing = /(missing|lack|need for|required for|gap)/.test(q);
    const asksCareer = /(career|role|path|job suits|which job|suited)/.test(q);
    const asksTime = /(how long|when will|weeks|months)/.test(q);

    if (asksCareer) {
      const top = careers.slice(0, 3);
      return {
        answer: `Based on your current skill profile, ${top[0].role} is your strongest fit at ${top[0].fitScore}% readiness. ${top[0].reason}`,
        bullets: top.map((c) => `${c.role} — ${c.fitScore}% fit · demand index ${c.demandIndex} · median ₹${c.medianSalaryLpa} LPA. ${c.reason}`),
        suggestedActions: [
          { label: "See your full skill gap", href: "/student/skill-gap" },
          { label: "Browse matching roles", href: "/student/jobs" },
        ],
        confidence: ctx.results.length > 0 ? "high" : "medium",
      };
    }

    if (asksReadiness) {
      const ready = gap.readinessScore >= 70;
      const blockers = [...gap.needsImprovement, ...gap.missing].slice(0, 3);
      return {
        answer: ready
          ? `Yes — you are at ${gap.readinessScore}% readiness for ${domain?.name}. Apply now and keep learning while you interview.`
          : `Not quite. You are at ${gap.readinessScore}% readiness for ${domain?.name}. ${blockers.length ? `The blockers are ${blockers.map((b) => b.skillName).join(", ")}.` : ""}`,
        bullets: [
          `Readiness: ${gap.readinessScore}% against ${domain?.name} industry expectations.`,
          ...(gap.strong.length ? [`Working in your favour: ${gap.strong.slice(0, 3).map((s) => s.skillName).join(", ")}.`] : []),
          ...blockers.map((b) => `${b.skillName}: you are at ${b.currentScore}%, roles expect ${b.requiredScore}%.`),
        ],
        suggestedActions: [
          { label: "Continue your learning path", href: `/student/learning/${primaryDomain}` },
          { label: "See matching internships", href: "/student/internships" },
        ],
        confidence: ctx.results.length > 0 ? "high" : "medium",
      };
    }

    if (asksMissing) {
      const missing = [...gap.needsImprovement, ...gap.missing].slice(0, 5);
      return {
        answer: missing.length
          ? `For ${domain?.name}, the skills holding you back are ${missing.map((m) => m.skillName).join(", ")}.`
          : `You have no significant gaps left in ${domain?.name} — you are meeting the expected level across the competency map.`,
        bullets: missing.map((m) => `${m.skillName}: ${m.currentScore}% now, ${m.requiredScore}% expected — a ${m.gap}-point gap.`),
        suggestedActions: [
          { label: "Open the gap analysis", href: "/student/skill-gap" },
          { label: "Jump to the modules that close it", href: `/student/learning/${primaryDomain}` },
        ],
        confidence: "high",
      };
    }

    if (asksTime) {
      const remaining = ctx.modules.filter(
        (m) => m.domainId === primaryDomain && !ctx.progress.some((p) => p.moduleId === m.id && p.status === "completed"),
      );
      const minutes = remaining.reduce((sum, m) => sum + m.estimatedMinutes, 0);
      const weeksAt5h = Math.max(1, Math.round(minutes / 60 / 5));
      return {
        answer: `You have roughly ${Math.round(minutes / 60)} hours of ${domain?.name} content left — about ${weeksAt5h} weeks at 5 hours a week.`,
        bullets: [
          `${remaining.length} modules remaining in your path.`,
          `Your current streak is what makes this predictable — consistency beats intensity here.`,
        ],
        suggestedActions: [{ label: "Check your streak", href: "/student/streak" }],
        confidence: "medium",
      };
    }

    // Default: what to learn next.
    const next = [...gap.needsImprovement, ...gap.missing].slice(0, 3);
    void asksNext;
    return {
      answer: next.length
        ? `Focus on ${next[0].skillName} next. It is your largest gap in ${domain?.name} (${next[0].currentScore}% against the ${next[0].requiredScore}% roles expect) and it unlocks the modules after it.`
        : `You are meeting the expected level across ${domain?.name}. The highest-value next move is applying it — take on a live project or start applying to matching roles.`,
      bullets: next.length
        ? next.map((n) => `${n.skillName}: ${n.currentScore}% → ${n.requiredScore}% target.`)
        : [`Readiness: ${gap.readinessScore}%.`, `Consider adding a second domain to broaden your profile.`],
      suggestedActions: [
        { label: "Open your learning path", href: `/student/learning/${primaryDomain}` },
        { label: "Add another domain", href: "/student/learning" },
      ],
      confidence: ctx.results.length > 0 ? "high" : "medium",
    };
  }
}

function buildGapSummary(
  domainName: string,
  readiness: number,
  strong: SkillGapEntry[],
  weak: SkillGapEntry[],
  missing: SkillGapEntry[],
): string {
  const parts: string[] = [];
  parts.push(`You are at ${readiness}% of what ${domainName} roles currently expect.`);
  if (strong.length) parts.push(`Your strongest areas are ${strong.slice(0, 3).map((s) => s.skillName).join(", ")}.`);
  const blockers = [...weak, ...missing].slice(0, 3);
  if (blockers.length) {
    parts.push(`The gaps worth closing first are ${blockers.map((b) => b.skillName).join(", ")} — they appear in most open postings for this domain.`);
  } else {
    parts.push(`No significant gaps remain — the next step is proving it through projects and applications.`);
  }
  return parts.join(" ");
}
