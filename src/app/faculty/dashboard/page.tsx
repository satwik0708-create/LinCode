import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import { getFacultyProfile, getInstitution } from "@/lib/data/users";
import { listProgramApplications } from "@/lib/data/opportunities";
import { getProgramRows, KIND_LABEL } from "@/lib/services/programs";
import { read } from "@/lib/data/store";
import { PageHeader } from "@/components/shell/page-header";
import { StatCard } from "@/components/shell/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProgramBoard } from "@/components/programs/program-board";
import { formatDate } from "@/lib/utils";
import type { CollaborationKind } from "@/lib/types";

export const metadata: Metadata = { title: "Faculty Dashboard" };

export default async function FacultyDashboard() {
  const user = await requireRole("faculty");
  const [profile, programs, applications, db] = await Promise.all([
    getFacultyProfile(user.id),
    getProgramRows(user.id, "faculty"),
    listProgramApplications(user.id),
    read(),
  ]);
  const institution = profile?.institutionId ? await getInstitution(profile.institutionId) : undefined;

  const closingSoon = [...programs]
    .filter((p) => !p.applied)
    .sort((a, b) => a.deadline.localeCompare(b.deadline))
    .slice(0, 4);

  const byKind = programs.reduce<Record<string, number>>((acc, p) => {
    acc[p.kind] = (acc[p.kind] ?? 0) + 1;
    return acc;
  }, {});

  const activeApplications = applications.filter((a) => !["rejected", "withdrawn"].includes(a.stage));

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome, ${user.name}`}
        description={
          profile
            ? `${profile.designation}, ${profile.department} · ${institution?.name ?? profile.institutionName}`
            : "Industry engagement opportunities for academicians."
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Open opportunities" value={programs.length} icon="Handshake" hint="Matched to your role" />
        <StatCard label="Your applications" value={applications.length} icon="ListChecks" hint={`${activeApplications.length} active`} />
        <StatCard label="FDPs available" value={byKind.fdp ?? 0} icon="GraduationCap" />
        <StatCard label="Research & consultancy" value={(byKind.research ?? 0) + (byKind.consultancy ?? 0)} icon="FlaskConical" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <h2 className="text-lg font-semibold tracking-tight">Closing soon</h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/faculty/collaboration">All opportunities<ArrowRight className="size-3.5" /></Link>
            </Button>
          </div>
          <ProgramBoard
            programs={closingSoon}
            searchable={false}
            emptyTitle="Nothing closing soon"
            emptyDescription="You have applied to everything currently open to faculty."
          />
        </div>

        <div className="min-w-0 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Your applications</CardTitle>
              <CardDescription>Status across every programme you applied to.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {applications.length === 0 && (
                <p className="text-sm text-muted-foreground">No applications yet.</p>
              )}
              {applications.slice(0, 5).map((application) => {
                const program = db.collaborationPrograms.find((p) => p.id === application.programId);
                return (
                  <div key={application.id} className="flex items-start justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{program?.title ?? "Programme"}</p>
                      <p className="text-xs text-muted-foreground">
                        {program ? KIND_LABEL[program.kind as CollaborationKind] : ""} · {formatDate(application.updatedAt)}
                      </p>
                    </div>
                    <Badge
                      variant={
                        application.stage === "selected" ? "success"
                          : application.stage === "rejected" ? "destructive"
                            : application.stage === "shortlisted" ? "warning" : "muted"
                      }
                      className="shrink-0 capitalize"
                    >
                      {application.stage.replace("_", " ")}
                    </Badge>
                  </div>
                );
              })}
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href="/faculty/applications">Full history<ArrowRight className="size-3.5" /></Link>
              </Button>
            </CardContent>
          </Card>

          {profile && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Your expertise</CardTitle>
                <CardDescription>Used to surface relevant programmes.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">Research areas</p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.researchAreas.length === 0 && <span className="text-xs text-muted-foreground">None listed</span>}
                    {profile.researchAreas.map((area) => <Badge key={area} variant="secondary">{area}</Badge>)}
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">Teaching expertise</p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.expertise.length === 0 && <span className="text-xs text-muted-foreground">None listed</span>}
                    {profile.expertise.map((area) => <Badge key={area} variant="muted">{area}</Badge>)}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {profile.yearsOfExperience} years of experience
                  {profile.publications ? ` · ${profile.publications} publications` : ""}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
