import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/guard";
import { getInstitutionAnalytics } from "@/lib/services/institution";
import { PageHeader } from "@/components/shell/page-header";
import { EmptyState } from "@/components/shell/empty-state";
import { Button } from "@/components/ui/button";
import { StudentTable } from "./student-table";

export const metadata: Metadata = { title: "Students" };

export default async function InstitutionStudentsPage() {
  const user = await requireRole("institution");
  if (!user.institutionId) {
    return (
      <EmptyState
        icon="Building2"
        title="Finish your institution profile"
        description="Link your account to an institution to see your cohort."
        action={<Button asChild><Link href="/onboarding/institution/profile">Complete profile</Link></Button>}
      />
    );
  }

  const analytics = await getInstitutionAnalytics(user.institutionId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        description="Skill development, learning progress and placement activity per student. This list contains only students registered to your institution."
      />
      {analytics.students.length === 0 ? (
        <EmptyState
          icon="Users"
          title="No students yet"
          description="Students who register with your institution appear here once they complete onboarding."
        />
      ) : (
        <StudentTable
          students={analytics.students}
          branches={[...new Set(analytics.students.map((s) => s.branch))].sort()}
          years={[...new Set(analytics.students.map((s) => s.graduationYear))].sort()}
        />
      )}
    </div>
  );
}
