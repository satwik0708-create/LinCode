import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireRoleForOnboarding } from "@/lib/services/onboarding";
import { getStudentProfile } from "@/lib/data/users";
import { getDomain } from "@/lib/domain/domains";
import { requiresDiagnostic } from "@/lib/domain/placement";
import { OnboardingAssessment } from "./onboarding-assessment";

export const metadata: Metadata = { title: "Diagnostic assessment" };

export default async function OnboardingAssessmentPage() {
  const user = await requireRoleForOnboarding("student");
  const profile = await getStudentProfile(user.id);
  if (!profile?.enrollments.length) redirect("/onboarding/student/domains");

  // Anything the student declared as intermediate/advanced and has not yet been
  // placed for still owes a diagnostic.
  const pending = profile.enrollments
    .filter((e) => requiresDiagnostic(e.declaredLevel) && e.placedLevel === null)
    .map((e) => ({
      id: e.domainId,
      name: getDomain(e.domainId)?.name ?? e.domainId,
      declaredLevel: e.declaredLevel,
    }));

  if (pending.length === 0) redirect("/onboarding/student/personalized-path");

  return <OnboardingAssessment queue={pending} />;
}
