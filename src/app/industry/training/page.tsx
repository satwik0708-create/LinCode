import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/guard";
import { getTrainingRows } from "@/lib/services/recruiter";
import { listCollaborationPrograms } from "@/lib/data/opportunities";
import { KIND_LABEL } from "@/lib/services/programs";
import { PageHeader } from "@/components/shell/page-header";
import { EmptyState } from "@/components/shell/empty-state";
import { StatCard } from "@/components/shell/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Training Programmes" };

export default async function IndustryTrainingPage() {
  const user = await requireRole("industry");
  if (!user.organizationId) {
    return (
      <EmptyState
        icon="Building2"
        title="Finish your organisation profile"
        description="Add your organisation before publishing programmes."
        action={<Button asChild><Link href="/onboarding/industry/profile">Complete profile</Link></Button>}
      />
    );
  }

  const [training, collaborations] = await Promise.all([
    getTrainingRows(user.organizationId),
    listCollaborationPrograms({ organizationId: user.organizationId }),
  ]);

  const totalSeats = training.reduce((sum, t) => sum + t.seats, 0);
  const totalEnrolled = training.reduce((sum, t) => sum + t.enrolledCount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Training & collaboration programmes"
        description="Certifications, workshops and mentorship you publish for students, plus the FDPs, faculty internships, research and consultancy you offer academia."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Student programmes" value={training.length} icon="GraduationCap" />
        <StatCard label="Seats offered" value={totalSeats} icon="Users" />
        <StatCard label="Enrolled" value={totalEnrolled} icon="ListChecks" tone="success" />
        <StatCard label="Academia programmes" value={collaborations.length} icon="Handshake" />
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold tracking-tight">For students</h2>
        {training.length === 0 ? (
          <EmptyState icon="GraduationCap" title="No student programmes yet" description="Publish a certification, workshop or mentorship track to build a candidate pipeline before recruitment season." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {training.map((program) => (
              <Card key={program.id}>
                <CardContent className="space-y-3 p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="capitalize">{program.kind}</Badge>
                    <Badge variant="muted" className="capitalize">{program.level}</Badge>
                    {program.certificateOffered && <Badge variant="success">Certificate</Badge>}
                  </div>
                  <div>
                    <h3 className="font-semibold">{program.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{program.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {program.skillNames.map((skill) => (
                      <Badge key={skill} variant="muted" className="text-[11px]">{skill}</Badge>
                    ))}
                  </div>
                  <div className="space-y-1.5 border-t pt-3">
                    <div className="flex items-baseline justify-between gap-2 text-xs">
                      <span className="text-muted-foreground">Enrolment</span>
                      <span className="tabular-nums">{program.enrolledCount} / {program.seats}</span>
                    </div>
                    <Progress value={(program.enrolledCount / Math.max(1, program.seats)) * 100} className="h-1.5" />
                    <p className="text-[11px] text-muted-foreground">
                      {program.durationWeeks} weeks · {program.mode.replace("_", " ")} · starts {formatDate(program.startsOn)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold tracking-tight">For academia</h2>
        {collaborations.length === 0 ? (
          <EmptyState icon="Handshake" title="No academia programmes yet" description="FDPs, faculty internships, consultancy and research collaborations appear here." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {collaborations.map((program) => (
              <Card key={program.id}>
                <CardContent className="p-4">
                  <Badge variant="muted">{KIND_LABEL[program.kind]}</Badge>
                  <p className="mt-2 font-medium">{program.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {program.seats} seats · {program.durationWeeks} weeks · starts {formatDate(program.startsOn)}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {program.audience.map((role) => (
                      <Badge key={role} variant="secondary" className="text-[10px] capitalize">{role}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
