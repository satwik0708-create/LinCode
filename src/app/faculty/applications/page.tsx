import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/guard";
import { listProgramApplications } from "@/lib/data/opportunities";
import { read } from "@/lib/data/store";
import { KIND_LABEL } from "@/lib/services/programs";
import { PageHeader } from "@/components/shell/page-header";
import { EmptyState } from "@/components/shell/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { CollaborationKind } from "@/lib/types";

export const metadata: Metadata = { title: "My Applications" };

export default async function FacultyApplicationsPage() {
  const user = await requireRole("faculty");
  const [applications, db] = await Promise.all([listProgramApplications(user.id), read()]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My applications"
        description="Every programme you have applied to, with the full history of how it moved."
      />

      {applications.length === 0 ? (
        <EmptyState
          icon="ListChecks"
          title="No applications yet"
          description="Apply to an FDP, internship or research collaboration and it will appear here."
        />
      ) : (
        <div className="space-y-3">
          {applications.map((application) => {
            const program = db.collaborationPrograms.find((p) => p.id === application.programId);
            const organization = program ? db.organizations.find((o) => o.id === program.organizationId) : undefined;
            return (
              <Card key={application.id}>
                <CardContent className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Badge variant="muted">
                        {program ? KIND_LABEL[program.kind as CollaborationKind] : "Programme"}
                      </Badge>
                      <h3 className="mt-2 font-semibold">{program?.title ?? "Programme"}</h3>
                      <p className="text-sm text-muted-foreground">{organization?.name ?? "Industry partner"}</p>
                    </div>
                    <Badge
                      variant={
                        application.stage === "selected" ? "success"
                          : application.stage === "rejected" ? "destructive"
                            : application.stage === "shortlisted" ? "warning" : "secondary"
                      }
                      className="capitalize"
                    >
                      {application.stage.replace("_", " ")}
                    </Badge>
                  </div>

                  {application.note && (
                    <p className="mt-3 rounded-lg bg-muted p-3 text-sm text-muted-foreground">{application.note}</p>
                  )}

                  <ol className="mt-4 space-y-2.5 border-l pl-4">
                    {application.timeline.map((event, index) => (
                      <li key={index} className="relative text-sm">
                        <span className="absolute -left-[21px] top-1.5 size-2 rounded-full bg-primary" aria-hidden />
                        <p className="font-medium capitalize">{event.stage.replace("_", " ")}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(event.at)}</p>
                        {event.note && <p className="mt-0.5 text-xs text-muted-foreground">{event.note}</p>}
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
