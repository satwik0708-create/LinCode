import type { Metadata } from "next";
import { requireRoleForOnboarding } from "@/lib/services/onboarding";
import { SimpleProfileForm } from "@/components/shell/simple-profile-form";

export const metadata: Metadata = { title: "Organisation profile" };

export default async function IndustryOnboardingPage() {
  await requireRoleForOnboarding("industry");

  return (
    <SimpleProfileForm
      title="Tell us about your organisation"
      subtitle="Postings, training programmes and candidate matching all run against this profile."
      endpoint="/api/onboarding/industry/profile"
      submitLabel="Enter my portal"
      sections={[
        {
          heading: "Organisation",
          description: "How students and institutions will see you.",
          fields: [
            { kind: "text", name: "companyName", label: "Company name", placeholder: "Nimbus Cloud Systems", required: true, span: true },
            { kind: "text", name: "industrySector", label: "Sector", placeholder: "Cloud & Infrastructure", required: true },
            { kind: "text", name: "companySize", label: "Company size", placeholder: "200-1000", required: true },
            { kind: "text", name: "designation", label: "Your designation", placeholder: "Talent Lead — Engineering", required: true },
            { kind: "text", name: "website", label: "Website", placeholder: "https://example.com" },
          ],
        },
        {
          heading: "Hiring focus",
          description: "The roles you typically recruit for.",
          fields: [
            {
              kind: "tags", name: "hiringFor", label: "Roles you hire for", max: 10,
              options: ["Full Stack Engineer", "Frontend Developer", "Backend Developer", "Cloud Engineer", "DevOps Engineer", "SRE", "Data Analyst", "Data Scientist", "ML Engineer", "Security Analyst"],
            },
          ],
        },
      ]}
    />
  );
}
