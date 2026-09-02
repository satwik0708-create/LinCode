import { requireRole } from "@/lib/auth/guard";
import { listNotifications } from "@/lib/data/users";
import { AppShell } from "@/components/shell/app-shell";
import { NAVIGATION, ROLE_WORKSPACE_LABEL } from "@/lib/navigation";

/**
 * Every page under /admin is gated here. `requireRole` re-reads the live user
 * record, so a revoked grant or a locked account is caught even though the
 * signed session cookie still parses.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("admin");
  const notifications = await listNotifications(user.id);

  return (
    <AppShell
      sections={NAVIGATION.admin}
      workspaceLabel={ROLE_WORKSPACE_LABEL.admin}
      user={{ name: user.name, email: user.email }}
      notifications={notifications}
      settingsHref="/admin/dashboard"
    >
      {children}
    </AppShell>
  );
}
