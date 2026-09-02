import type { Metadata } from "next";
import { requireRoleForOnboarding } from "@/lib/services/onboarding";
import { getStudentProfile } from "@/lib/data/users";
import { LEARNING_DOMAINS } from "@/lib/domain/domains";
import { skillName } from "@/lib/domain/skills";
import { DomainSelector } from "./domain-selector";

export const metadata: Metadata = { title: "Choose your learning domains" };

export default async function DomainsPage() {
  const user = await requireRoleForOnboarding("student");
  const profile = await getStudentProfile(user.id);

  const domains = LEARNING_DOMAINS.map((domain) => ({
    id: domain.id,
    name: domain.name,
    tagline: domain.tagline,
    description: domain.description,
    icon: domain.icon,
    gradient: domain.gradient,
    estimatedWeeks: domain.estimatedWeeks,
    industryDemand: domain.industryDemand,
    roles: domain.roles,
    topSkills: domain.skillIds.slice(0, 6).map(skillName),
    moduleCount: domain.skillIds.length,
  }));

  return <DomainSelector domains={domains} preselected={profile?.enrollments.map((e) => e.domainId) ?? []} />;
}
