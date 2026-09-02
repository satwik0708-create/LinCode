import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/guard";
import { read } from "@/lib/data/store";
import { PageHeader } from "@/components/shell/page-header";
import { StatCard } from "@/components/shell/stat-card";
import { BarList } from "@/components/shell/bar-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ROLE_LABEL } from "@/lib/auth/roles";
import { skillName } from "@/lib/domain/skills";
import { LEARNING_DOMAINS } from "@/lib/domain/domains";
import type { Role } from "@/lib/types";

export const metadata: Metadata = { title: "Platform Administration" };

/**
 * Platform-wide analytics for policymakers and administrators.
 *
 * This route sits behind the `admin` grant, which is provisioned out of band —
 * it is never selectable at registration, so no student, faculty member or
 * recruiter can reach these numbers.
 */
export default async function AdminDashboard() {
  await requireRole("admin");
  const db = await read();

  const byRole = (["student", "faculty", "industry", "institution", "admin"] as Role[]).map((role) => ({
    label: ROLE_LABEL[role],
    value: db.users.filter((u) => u.roles.includes(role)).length,
  }));

  const demand = new Map<string, number>();
  for (const opportunity of db.opportunities.filter((o) => o.status === "open")) {
    for (const requirement of opportunity.requirements) {
      demand.set(requirement.skillId, (demand.get(requirement.skillId) ?? 0) + 1);
    }
  }

  const domainEnrolment = LEARNING_DOMAINS.map((domain) => ({
    label: domain.name,
    value: db.studentProfiles.filter((p) => p.enrollments.some((e) => e.domainId === domain.id)).length,
  })).sort((a, b) => b.value - a.value);

  const placements = db.applications.filter((a) => a.stage === "selected").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform administration"
        description="National-level view across institutions, industries and learners. Restricted to provisioned administrators."
        actions={<Button asChild variant="outline"><Link href="/admin/audit">Audit log</Link></Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Registered users" value={db.users.length} icon="Users" />
        <StatCard label="Institutions" value={db.institutions.length} icon="Building2" />
        <StatCard label="Open postings" value={db.opportunities.filter((o) => o.status === "open").length} icon="Briefcase" />
        <StatCard label="Placements made" value={placements} icon="ListChecks" tone="success" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Users by role</CardTitle>
            <CardDescription>Role grants across the platform.</CardDescription>
          </CardHeader>
          <CardContent><BarList rows={byRole} /></CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">National skill demand</CardTitle>
            <CardDescription>Most-requested skills across every open posting.</CardDescription>
          </CardHeader>
          <CardContent>
            <BarList
              rows={[...demand.entries()]
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([skillId, count]) => ({ label: skillName(skillId), value: count }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Domain enrolment</CardTitle>
            <CardDescription>Learner distribution across domains.</CardDescription>
          </CardHeader>
          <CardContent><BarList rows={domainEnrolment} /></CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Collaboration activity</CardTitle>
            <CardDescription>Industry–academia programmes on the platform.</CardDescription>
          </CardHeader>
          <CardContent>
            <BarList
              rows={[
                { label: "Collaboration programmes", value: db.collaborationPrograms.length },
                { label: "Programme applications", value: db.programApplications.length },
                { label: "Training programmes", value: db.trainingPrograms.length },
                { label: "Training enrolments", value: db.enrollments.length },
              ]}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
