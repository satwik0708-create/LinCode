"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, MapPin, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shell/empty-state";
import { postJson } from "@/lib/client";
import { formatDate, relativeDays } from "@/lib/utils";
import type { PostingRow } from "@/lib/services/recruiter";

export function PostingList({
  postings, emptyTitle, emptyDescription,
}: {
  postings: PostingRow[];
  emptyTitle: string;
  emptyDescription: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<string>();

  async function setStatus(opportunityId: string, status: "open" | "closed") {
    setBusy(opportunityId);
    await postJson("/api/opportunities/status", { opportunityId, status });
    setBusy(undefined);
    router.refresh();
  }

  if (postings.length === 0) {
    return <EmptyState icon="Briefcase" title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="space-y-3">
      {postings.map((posting) => (
        <Card key={posting.id}>
          <CardContent className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="muted" className="capitalize">{posting.type}</Badge>
                  <Badge variant={posting.status === "open" ? "success" : "secondary"} className="capitalize">
                    {posting.status}
                  </Badge>
                </div>
                <h3 className="mt-2 font-semibold">{posting.title}</h3>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="size-3" />{posting.location} · {posting.workMode}</span>
                  <span className="flex items-center gap-1"><Users className="size-3" />{posting.openings} openings</span>
                </p>
              </div>

              <div className="text-right">
                <p className="text-2xl font-semibold tabular-nums leading-none">{posting.applicantCount}</p>
                <p className="text-[11px] text-muted-foreground">applicants</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{posting.shortlistedCount} shortlisted</p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {posting.requiredSkills.map((skill) => (
                <Badge
                  key={skill}
                  variant={posting.mandatorySkills.includes(skill) ? "default" : "muted"}
                  className="text-[11px]"
                >
                  {skill}{posting.mandatorySkills.includes(skill) && " *"}
                </Badge>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-3">
              <span className="text-xs text-muted-foreground">
                Posted {formatDate(posting.createdAt)} · closes {relativeDays(posting.deadline)}
              </span>
              <Button
                size="sm"
                variant="outline"
                className="ml-auto"
                onClick={() => setStatus(posting.id, posting.status === "open" ? "closed" : "open")}
                disabled={busy === posting.id}
              >
                {busy === posting.id && <Loader2 className="size-3.5 animate-spin" />}
                {posting.status === "open" ? "Close posting" : "Reopen posting"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
