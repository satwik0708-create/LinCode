import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireRoleForOnboarding } from "@/lib/services/onboarding";
import { getStudentProfile } from "@/lib/data/users";
import { getDomain } from "@/lib/domain/domains";
import { getPathView, getSkillGap } from "@/lib/services/student";
import { PathReveal } from "./path-reveal";

export const metadata: Metadata = { title: "Your personalised path" };

export default async function PersonalizedPathPage() {
  const user = await requireRoleForOnboarding("student");
  const profile = await getStudentProfile(user.id);
  if (!profile?.enrollments.length) redirect("/onboarding/student/domains");

  const domains = await Promise.all(
    profile.enrollments.map(async (enrollment) => {
      const [gap, view] = await Promise.all([
        getSkillGap(user.id, enrollment.domainId),
        getPathView(user.id, enrollment.domainId),
      ]);
      const domain = getDomain(enrollment.domainId);
      return {
        id: enrollment.domainId,
        name: domain?.name ?? enrollment.domainId,
        gradient: domain?.gradient ?? "from-slate-500 to-slate-600",
        icon: domain?.icon ?? "BookOpen",
        placedLevel: enrollment.placedLevel ?? enrollment.declaredLevel,
        placementScore: enrollment.placementScore,
        gap,
        steps: view?.steps ?? [],
      };
    }),
  );

  return <PathReveal name={user.name} domains={domains} />;
}
