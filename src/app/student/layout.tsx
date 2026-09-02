import { requireRole } from "@/lib/auth/guard";
import { listNotifications } from "@/lib/data/users";
import { AppShell } from "@/components/shell/app-shell";
import { NAVIGATION, ROLE_WORKSPACE_LABEL } from "@/lib/navigation";

/**
 * Every page under /student is gated here. `requireRole` re-reads the live user
 * record, so a revoked grant or a locked account is caught even though the
 * signed session cookie still parses.
 */
export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("student");
  const notifications = await listNotifications(user.id);

  return (
    <AppShell
      sections={NAVIGATION.student}
      workspaceLabel={ROLE_WORKSPACE_LABEL.student}
      user={{ name: user.name, email: user.email }}
      notifications={notifications}
      settingsHref="/student/settings"
      profileHref="/student/profile"
    >
      {children}
    </AppShell>
  );
}
