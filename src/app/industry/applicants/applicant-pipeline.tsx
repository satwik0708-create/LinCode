"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FormAlert } from "@/components/auth/form-field";
import { postJson } from "@/lib/client";
import { cn, formatDate, initials } from "@/lib/utils";
import type { ApplicantRow } from "@/lib/services/recruiter";
import type { ApplicationStage } from "@/lib/types";

const STAGES: Array<{ value: ApplicationStage; label: string }> = [
  { value: "applied", label: "Applied" },
  { value: "under_review", label: "Under review" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "interview", label: "Interview" },
  { value: "selected", label: "Selected" },
  { value: "rejected", label: "Rejected" },
];

export function ApplicantPipeline({
  applicants, postings,
}: {
  applicants: ApplicantRow[];
  postings: Array<{ id: string; title: string }>;
}) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [posting, setPosting] = React.useState("all");
  const [minMatch, setMinMatch] = React.useState(0);
  const [busy, setBusy] = React.useState<string>();
  const [error, setError] = React.useState<string>();

  const filtered = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    return applicants
      .filter((a) => (posting === "all" ? true : a.opportunityId === posting))
      .filter((a) => a.matchScore >= minMatch)
      .filter((a) =>
        !needle ||
        a.studentName.toLowerCase().includes(needle) ||
        a.institutionName.toLowerCase().includes(needle) ||
        a.branch.toLowerCase().includes(needle) ||
        a.topSkills.some((s) => s.name.toLowerCase().includes(needle)),
      )
      .sort((a, b) => b.matchScore - a.matchScore);
  }, [applicants, query, posting, minMatch]);

  async function advance(applicationId: string, stage: ApplicationStage) {
    setBusy(applicationId);
    setError(undefined);
    const result = await postJson("/api/applications/advance", { applicationId, stage });
    setBusy(undefined);
    if (!result.ok) {
      setError(result.error ?? "Could not update that application.");
      return;
    }
    router.refresh();
  }

  const groups: Array<{ key: string; label: string; rows: ApplicantRow[] }> = [
    { key: "new", label: "New", rows: filtered.filter((a) => a.stage === "applied") },
    { key: "progress", label: "In progress", rows: filtered.filter((a) => ["under_review", "shortlisted", "interview"].includes(a.stage)) },
    { key: "closed", label: "Decided", rows: filtered.filter((a) => ["selected", "rejected", "withdrawn"].includes(a.stage)) },
    { key: "all", label: "All", rows: filtered },
  ];

  return (
    <div className="space-y-5">
      {error && <FormAlert tone="error">{error}</FormAlert>}

      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, institution, branch or skill"
            className="pl-9"
            aria-label="Search applicants"
          />
        </div>
        <select
          value={posting}
          onChange={(e) => setPosting(e.target.value)}
          aria-label="Filter by posting"
          className="h-10 rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="all">All postings</option>
          {postings.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
        <select
          value={minMatch}
          onChange={(e) => setMinMatch(Number(e.target.value))}
          aria-label="Minimum skill match"
          className="h-10 rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value={0}>Any match</option>
          <option value={50}>50%+ match</option>
          <option value={70}>70%+ match</option>
          <option value={85}>85%+ match</option>
        </select>
      </div>

      <Tabs defaultValue="new">
        <TabsList className="flex w-full flex-wrap justify-start">
          {groups.map((group) => (
            <TabsTrigger key={group.key} value={group.key}>
              {group.label} ({group.rows.length})
            </TabsTrigger>
          ))}
        </TabsList>

        {groups.map((group) => (
          <TabsContent key={group.key} value={group.key} className="space-y-3">
            {group.rows.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">No applicants in this group.</p>
            )}
            {group.rows.map((applicant) => (
              <Card key={applicant.applicationId}>
                <CardContent className="p-5">
                  <div className="flex flex-wrap items-start gap-4">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">
                      {initials(applicant.studentName)}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{applicant.studentName}</h3>
                        <Badge variant="secondary" className="capitalize">{applicant.stage.replace("_", " ")}</Badge>
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {applicant.degree} {applicant.branch} · {applicant.institutionName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Graduating {applicant.graduationYear}
                        {applicant.cgpa != null && ` · CGPA ${applicant.cgpa}`}
                        {" · applied to "}{applicant.opportunityTitle}
                        {" · "}{formatDate(applicant.appliedAt)}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p
                        className={cn(
                          "text-2xl font-semibold tabular-nums leading-none",
                          applicant.matchScore >= 75 ? "text-success" : applicant.matchScore >= 50 ? "text-warning" : "text-muted-foreground",
                        )}
                      >
                        {applicant.matchScore}%
                      </p>
                      <p className="text-[11px] text-muted-foreground">skill match</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {applicant.topSkills.map((skill) => (
                      <div key={skill.name} className="space-y-1">
                        <div className="flex items-baseline justify-between gap-2 text-xs">
                          <span className="truncate">{skill.name}</span>
                          <span className="tabular-nums text-muted-foreground">{skill.score}%</span>
                        </div>
                        <Progress
                          value={skill.score}
                          className="h-1.5"
                          indicatorClassName={skill.score >= 75 ? "bg-success" : skill.score >= 45 ? "bg-warning" : "bg-destructive"}
                        />
                      </div>
                    ))}
                  </div>

                  {applicant.coverNote && (
                    <p className="mt-3 rounded-lg bg-muted p-3 text-sm text-muted-foreground">{applicant.coverNote}</p>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-3">
                    {applicant.resumeDocumentId && (
                      <Button asChild size="sm" variant="outline">
                        <a href={`/api/documents/${applicant.resumeDocumentId}`}>
                          <FileText className="size-3.5" />
                          Resume
                        </a>
                      </Button>
                    )}
                    <div className="ml-auto flex flex-wrap items-center gap-1.5">
                      {busy === applicant.applicationId && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
                      {STAGES.filter((s) => s.value !== applicant.stage).map((stage) => (
                        <Button
                          key={stage.value}
                          size="sm"
                          variant={stage.value === "rejected" ? "ghost" : "outline"}
                          className={cn(stage.value === "rejected" && "text-destructive hover:text-destructive")}
                          onClick={() => advance(applicant.applicationId, stage.value)}
                          disabled={busy === applicant.applicationId}
                        >
                          {stage.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
