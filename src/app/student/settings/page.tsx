import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/guard";
import { getDomainSnapshots } from "@/lib/services/student";
import { PageHeader } from "@/components/shell/page-header";
import { SettingsView } from "@/components/shell/settings-view";

export const metadata: Metadata = { title: "Settings" };

export default async function StudentSettingsPage() {
  const user = await requireRole("student");
  const snapshots = await getDomainSnapshots(user.id);

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Appearance, learning, account and accessibility." />
      <SettingsView
        roleLabel="Student"
        account={{ name: user.name, email: user.email, mobile: user.mobile }}
        learning={{
          domains: snapshots.map((s) => ({
            id: s.enrollment.domainId,
            name: s.domainName,
            level: s.enrollment.placedLevel ?? s.enrollment.declaredLevel,
            progress: s.enrollment.progress,
            status: s.enrollment.status,
          })),
        }}
      />
    </div>
  );
}
