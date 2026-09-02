import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/guard";
import { getStudentProfile } from "@/lib/data/users";
import { getSkillGap } from "@/lib/services/student";
import { getDomain } from "@/lib/domain/domains";
import { PageHeader } from "@/components/shell/page-header";
import { SkillGapView } from "@/components/student/skill-gap-view";
import { EmptyState } from "@/components/shell/empty-state";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DomainIcon } from "@/components/student/domain-icon";

export const metadata: Metadata = { title: "Skill Gap" };

export default async function SkillGapPage() {
  const user = await requireRole("student");
  const profile = await getStudentProfile(user.id);
  const enrollments = profile?.enrollments ?? [];

  if (enrollments.length === 0) {
    return (
      <div className="space-y-8">
        <PageHeader title="Skill Gap" description="Your competency map against live industry requirements." />
        <EmptyState
          icon="Target"
          title="No gap analysis yet"
          description="Enrol in a domain and take its diagnostic — the gap is measured against that domain's competency map and current postings."
          action={<Button asChild><Link href="/student/learning">Choose a domain</Link></Button>}
        />
      </div>
    );
  }

  const reports = await Promise.all(
    enrollments.map(async (enrollment) => ({
      id: enrollment.domainId,
      name: getDomain(enrollment.domainId)?.name ?? enrollment.domainId,
      icon: getDomain(enrollment.domainId)?.icon ?? "BookOpen",
      report: await getSkillGap(user.id, enrollment.domainId),
    })),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Skill Gap"
        description="What you have, what the market expects, and the distance between them — per domain. Required levels rise with how often a skill appears in open postings."
      />

      <Tabs defaultValue={reports[0]?.id}>
        <TabsList className="flex w-full flex-wrap justify-start">
          {reports.map((entry) => (
            <TabsTrigger key={entry.id} value={entry.id} className="gap-2">
              <DomainIcon name={entry.icon} className="size-3.5 h-3.5 w-3.5" />
              <span className="max-w-32 truncate">{entry.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {reports.map((entry) => (
          <TabsContent key={entry.id} value={entry.id}>
            {entry.report ? (
              <SkillGapView report={entry.report} domainName={entry.name} />
            ) : (
              <EmptyState icon="Target" title="Not enough evidence yet" description="Take the diagnostic for this domain to generate a gap analysis." />
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link href={`/student/learning/${entry.id}`}>Open learning path</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href={`/student/assessment?domain=${entry.id}`}>Retake diagnostic</Link>
              </Button>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
