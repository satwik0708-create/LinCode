import type { Metadata } from "next";
import { requireRoleForOnboarding } from "@/lib/services/onboarding";
import { SimpleProfileForm } from "@/components/shell/simple-profile-form";

export const metadata: Metadata = { title: "Institution profile" };

export default async function InstitutionOnboardingPage() {
  await requireRoleForOnboarding("institution");

  return (
    <SimpleProfileForm
      title="Set up your institution workspace"
      subtitle="Your analytics are scoped to this institution — you will only ever see your own students' data."
      endpoint="/api/onboarding/institution/profile"
      submitLabel="Enter my dashboard"
      sections={[
        {
          heading: "Institution",
          description: "The institution whose cohort you are responsible for.",
          fields: [
            { kind: "text", name: "institutionName", label: "Institution", placeholder: "Government College of Engineering, Pune", required: true, span: true },
            { kind: "text", name: "designation", label: "Your designation", placeholder: "Head — Career Development Cell", required: true },
            { kind: "text", name: "department", label: "Department / cell", placeholder: "Placement Office" },
          ],
        },
      ]}
    />
  );
}
