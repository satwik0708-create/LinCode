import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/guard";
import { recentAudit } from "@/lib/data/users";
import { read } from "@/lib/data/store";
import { PageHeader } from "@/components/shell/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shell/empty-state";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Audit Log" };

/**
 * Security event log. Records authentication outcomes, role changes and every
 * denied access attempt — the trail you need to notice someone probing for data
 * they are not entitled to.
 */
export default async function AuditPage() {
  await requireRole("admin");
  const [events, db] = await Promise.all([recentAudit(200), read()]);
  const names = new Map(db.users.map((u) => [u.id, u.name]));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit log"
        description="Authentication, authorisation and document-access events. Denied attempts are recorded with the actor and the resource."
      />

      {events.length === 0 ? (
        <EmptyState icon="ScrollText" title="No events recorded" description="Security events appear here as users sign in and access resources." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="px-4 py-3 font-medium">When</th>
                    <th className="px-4 py-3 font-medium">Actor</th>
                    <th className="px-4 py-3 font-medium">Action</th>
                    <th className="px-4 py-3 font-medium">Outcome</th>
                    <th className="px-4 py-3 font-medium">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {events.map((event) => (
                    <tr key={event.id}>
                      <td className="whitespace-nowrap px-4 py-2.5 text-xs text-muted-foreground">
                        {formatDate(event.createdAt, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                      </td>
                      <td className="px-4 py-2.5">{event.userId ? (names.get(event.userId) ?? event.userId) : "anonymous"}</td>
                      <td className="px-4 py-2.5 font-mono text-xs">{event.action}</td>
                      <td className="px-4 py-2.5">
                        <Badge
                          variant={
                            event.outcome === "success" ? "success"
                              : event.outcome === "denied" ? "destructive" : "warning"
                          }
                        >
                          {event.outcome}
                        </Badge>
                      </td>
                      <td className="max-w-xs truncate px-4 py-2.5 text-xs text-muted-foreground">{event.detail ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
