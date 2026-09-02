import type { Metadata } from "next";
import { requireRoleForOnboarding } from "@/lib/services/onboarding";
import { getInstitution } from "@/lib/data/users";
import { InstitutionOnboarding } from "./institution-onboarding";

export const metadata: Metadata = { title: "Register your institution" };

export default async function InstitutionOnboardingPage() {
  const user = await requireRoleForOnboarding("institution");
  // If the institution step is already done, resume at the representative step.
  const institution = user.institutionId ? await getInstitution(user.institutionId) : undefined;

  return (
    <InstitutionOnboarding
      accountName={user.name}
      accountEmail={user.email}
      existing={
        institution
          ? {
              institutionName: institution.name,
              type: institution.type,
              website: institution.website ?? "",
              officialEmail: institution.officialEmail ?? "",
              address: institution.address ?? "",
              city: institution.city,
              state: institution.state,
              accreditation: institution.accreditation ?? "",
            }
          : null
      }
    />
  );
}
