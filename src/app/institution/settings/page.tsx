import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/guard";
import { PageHeader } from "@/components/shell/page-header";
import { SettingsView } from "@/components/shell/settings-view";

export const metadata: Metadata = { title: "Settings" };

export default async function InstitutionSettingsPage() {
  const user = await requireRole("institution");

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Appearance, account and accessibility." />
      <SettingsView
        roleLabel="Institution"
        account={{ name: user.name, email: user.email, mobile: user.mobile }}
      />
    </div>
  );
}
