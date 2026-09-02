import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireRoleForOnboarding } from "@/lib/services/onboarding";
import { getStudentProfile } from "@/lib/data/users";
import { getDomain } from "@/lib/domain/domains";
import { LevelSelector } from "./level-selector";

export const metadata: Metadata = { title: "Set your level" };

export default async function LevelPage() {
  const user = await requireRoleForOnboarding("student");
  const profile = await getStudentProfile(user.id);

  if (!profile?.enrollments.length) redirect("/onboarding/student/domains");

  const domains = profile.enrollments.map((enrollment) => {
    const domain = getDomain(enrollment.domainId);
    return {
      id: enrollment.domainId,
      name: domain?.name ?? enrollment.domainId,
      icon: domain?.icon ?? "BookOpen",
      gradient: domain?.gradient ?? "from-slate-500 to-slate-600",
      currentLevel: enrollment.placedLevel ? enrollment.declaredLevel : null,
    };
  });

  return <LevelSelector domains={domains} />;
}
