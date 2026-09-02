import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/guard";
import { getStudentProfile } from "@/lib/data/users";
import { listResults } from "@/lib/data/learning";
import { getDomain, LEARNING_DOMAINS } from "@/lib/domain/domains";
import { PageHeader } from "@/components/shell/page-header";
import { AssessmentCentre } from "./assessment-centre";

export const metadata: Metadata = { title: "Skill Assessment" };

export default async function AssessmentPage({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string }>;
}) {
  const { domain } = await searchParams;
  const user = await requireRole("student");
  const [profile, results] = await Promise.all([getStudentProfile(user.id), listResults(user.id)]);

  const enrolled = (profile?.enrollments ?? []).map((enrollment) => {
    const d = getDomain(enrollment.domainId);
    const history = results.filter((r) => r.domainId === enrollment.domainId);
    return {
      id: enrollment.domainId,
      name: d?.name ?? enrollment.domainId,
      icon: d?.icon ?? "BookOpen",
      gradient: d?.gradient ?? "from-slate-500 to-slate-600",
      declaredLevel: enrollment.declaredLevel,
      placedLevel: enrollment.placedLevel,
      placementScore: enrollment.placementScore,
      attempts: history.length,
      lastScore: history[0]?.scorePercent ?? null,
      lastTakenAt: history[0]?.createdAt ?? null,
    };
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Skill Assessment"
        description="Each domain has its own diagnostic drawn from its own competency map. Retake one whenever you want your skill profile re-measured — results feed straight into your gap analysis and learning path."
      />
      <AssessmentCentre
        domains={enrolled}
        initialDomain={domain && LEARNING_DOMAINS.some((d) => d.id === domain) ? domain : undefined}
      />
    </div>
  );
}
