import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/guard";
import { listPendingCertifications } from "@/lib/data/portfolio";
import { skillName } from "@/lib/domain/skills";
import { PageHeader } from "@/components/shell/page-header";
import { EmptyState } from "@/components/shell/empty-state";
import { Button } from "@/components/ui/button";
import { VerificationQueue } from "./verification-queue";

export const metadata: Metadata = { title: "Verifications" };

export default async function InstitutionVerificationsPage() {
  const user = await requireRole("institution");
  if (!user.institutionId) {
    return (
      <EmptyState
        icon="Building2"
        title="Finish your institution profile"
        description="Register your institution before reviewing student claims."
        action={<Button asChild><Link href="/onboarding/institution/profile">Complete profile</Link></Button>}
      />
    );
  }

  const pending = await listPendingCertifications(user.institutionId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Verifications"
        description="Certificates your students submitted as evidence. Verifying one marks it verified on their portfolio, where recruiters can see it."
      />
      <VerificationQueue
        items={pending.map(({ certification, studentId, studentName }) => ({
          id: certification.id,
          studentId,
          studentName,
          name: certification.name,
          issuer: certification.issuer,
          issuedOn: certification.issuedOn,
          credentialId: certification.credentialId,
          credentialUrl: certification.credentialUrl,
          documentId: certification.documentId,
          submittedAt: certification.submittedAt,
          skills: certification.skillIds.map(skillName),
        }))}
      />
    </div>
  );
}
