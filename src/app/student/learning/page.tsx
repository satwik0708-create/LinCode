import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/guard";
import { getDomainSnapshots } from "@/lib/services/student";
import { LEARNING_DOMAINS } from "@/lib/domain/domains";
import { skillName } from "@/lib/domain/skills";
import { modulesForDomain } from "@/lib/domain/curriculum";
import { PageHeader } from "@/components/shell/page-header";
import { DomainProgressCard } from "@/components/student/domain-progress-card";
import { AddDomainPanel } from "./add-domain-panel";
import { EmptyState } from "@/components/shell/empty-state";

export const metadata: Metadata = { title: "My Learning" };

export default async function MyLearningPage() {
  const user = await requireRole("student");
  const snapshots = await getDomainSnapshots(user.id);
  const enrolledIds = new Set(snapshots.map((s) => s.enrollment.domainId));

  const available = LEARNING_DOMAINS.filter((d) => !enrolledIds.has(d.id)).map((domain) => ({
    id: domain.id,
    name: domain.name,
    tagline: domain.tagline,
    description: domain.description,
    icon: domain.icon,
    gradient: domain.gradient,
    estimatedWeeks: domain.estimatedWeeks,
    moduleCount: modulesForDomain(domain.id).length,
    topSkills: domain.skillIds.slice(0, 5).map(skillName),
  }));

  const completed = snapshots.filter((s) => s.enrollment.status === "completed");
  const inProgress = snapshots.filter((s) => s.enrollment.status !== "completed");

  return (
    <div className="space-y-8">
      <PageHeader
        title="My Learning"
        description="Every domain keeps its own progress. Finishing one never closes the others, and you can add more whenever you like."
      />

      {snapshots.length === 0 && (
        <EmptyState
          icon="BookOpen"
          title="You are not enrolled in any domain yet"
          description="Choose one below to get a diagnostic, a gap analysis and a personalised path."
        />
      )}

      {inProgress.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold tracking-tight">In progress</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {inProgress.map((snapshot) => (
              <DomainProgressCard key={snapshot.enrollment.domainId} snapshot={snapshot} />
            ))}
          </div>
        </section>
      )}

      {completed.length > 0 && (
        <section>
          <h2 className="mb-1 text-lg font-semibold tracking-tight">Completed</h2>
          <p className="mb-3 text-sm text-muted-foreground">
            Finished domains stay available — revisit any module without affecting your progress elsewhere.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {completed.map((snapshot) => (
              <DomainProgressCard key={snapshot.enrollment.domainId} snapshot={snapshot} />
            ))}
          </div>
        </section>
      )}

      {available.length > 0 && (
        <section>
          <h2 className="mb-1 text-lg font-semibold tracking-tight">Add another domain</h2>
          <p className="mb-3 text-sm text-muted-foreground">
            Pick a level when you add it — beginner starts immediately, intermediate and advanced take a short diagnostic first.
          </p>
          <AddDomainPanel domains={available} />
        </section>
      )}
    </div>
  );
}
