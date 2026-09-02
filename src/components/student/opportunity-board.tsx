"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, SlidersHorizontal } from "lucide-react";
import { Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { FormAlert } from "@/components/auth/form-field";
import { OpportunityCard } from "@/components/student/opportunity-card";
import { EmptyState } from "@/components/shell/empty-state";
import { postJson } from "@/lib/client";
import { cn } from "@/lib/utils";
import type { MatchedOpportunity } from "@/lib/services/student";

type SortKey = "match" | "deadline" | "recent";

/**
 * Search, filter, sort and apply. Client-side filtering over a server-scored
 * list — the match scores themselves are computed on the server against the
 * student's own skill matrix.
 */
export function OpportunityBoard({
  entries, organizations, emptyTitle, emptyDescription,
}: {
  entries: Array<MatchedOpportunity & { organizationName: string }>;
  organizations: string[];
  emptyTitle: string;
  emptyDescription: string;
}) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [org, setOrg] = React.useState<string>("all");
  const [sort, setSort] = React.useState<SortKey>("match");
  const [eligibleOnly, setEligibleOnly] = React.useState(false);
  const [applyTo, setApplyTo] = React.useState<MatchedOpportunity & { organizationName: string }>();
  const [note, setNote] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string>();

  const filtered = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    const list = entries.filter((entry) => {
      if (eligibleOnly && !entry.match.eligible) return false;
      if (org !== "all" && entry.organizationName !== org) return false;
      if (!needle) return true;
      return (
        entry.opportunity.title.toLowerCase().includes(needle) ||
        entry.organizationName.toLowerCase().includes(needle) ||
        entry.opportunity.location.toLowerCase().includes(needle) ||
        entry.match.breakdown.some((b) => b.skillName.toLowerCase().includes(needle))
      );
    });

    return [...list].sort((a, b) => {
      if (sort === "match") return b.match.matchScore - a.match.matchScore;
      if (sort === "deadline") return a.opportunity.deadline.localeCompare(b.opportunity.deadline);
      return b.opportunity.createdAt.localeCompare(a.opportunity.createdAt);
    });
  }, [entries, query, org, sort, eligibleOnly]);

  async function submitApplication() {
    if (!applyTo) return;
    setPending(true);
    setError(undefined);

    const result = await postJson("/api/applications/apply", {
      opportunityId: applyTo.opportunity.id,
      coverNote: note.trim() || undefined,
    });
    setPending(false);

    if (!result.ok) {
      setError(result.error ?? "Could not submit your application.");
      return;
    }
    setApplyTo(undefined);
    setNote("");
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by role, company, skill or location"
            className="pl-9"
            aria-label="Search opportunities"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={org}
            onChange={(e) => setOrg(e.target.value)}
            aria-label="Filter by company"
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All companies</option>
            {organizations.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            aria-label="Sort opportunities"
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="match">Best skill match</option>
            <option value="deadline">Closing soonest</option>
            <option value="recent">Recently posted</option>
          </select>

          <button
            type="button"
            onClick={() => setEligibleOnly((v) => !v)}
            aria-pressed={eligibleOnly}
            className={cn(
              "inline-flex h-10 items-center gap-1.5 rounded-lg border px-3 text-sm transition-colors",
              eligibleOnly ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent",
            )}
          >
            <SlidersHorizontal className="size-3.5" />
            Eligible only
          </button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {filtered.length} {filtered.length === 1 ? "opportunity" : "opportunities"}
        {eligibleOnly && " you are eligible for"}
      </p>

      {filtered.length === 0 ? (
        <EmptyState icon="Briefcase" title={emptyTitle} description={emptyDescription} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((entry) => (
            <OpportunityCard
              key={entry.opportunity.id}
              entry={entry}
              organizationName={entry.organizationName}
              action={
                entry.applied ? (
                  <Button size="sm" variant="secondary" className="w-full" disabled>
                    <Badge variant="success" className="border-0 bg-transparent p-0">Applied</Badge>
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="w-full"
                    disabled={!entry.match.eligible}
                    onClick={() => { setApplyTo(entry); setNote(""); setError(undefined); }}
                  >
                    {entry.match.eligible ? "Apply now" : "Not eligible"}
                  </Button>
                )
              }
            />
          ))}
        </div>
      )}

      <Dialog open={!!applyTo} onOpenChange={(open) => !open && setApplyTo(undefined)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply to {applyTo?.opportunity.title}</DialogTitle>
            <DialogDescription>
              {applyTo?.organizationName} · {applyTo?.match.matchScore}% skill match.
              Your profile, skill matrix and resume are shared with this employer only.
            </DialogDescription>
          </DialogHeader>

          {error && <FormAlert tone="error">{error}</FormAlert>}

          <div className="space-y-1.5">
            <label htmlFor="cover-note" className="text-sm font-medium">Cover note <span className="font-normal text-muted-foreground">(optional)</span></label>
            <Textarea
              id="cover-note"
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 1500))}
              placeholder="Anything the recruiter should know — a relevant project, why this role."
            />
            <p className="text-xs text-muted-foreground">{note.length}/1500</p>
          </div>

          {applyTo && applyTo.match.breakdown.some((b) => b.verdict !== "met") && (
            <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
              You are below the bar on{" "}
              {applyTo.match.breakdown.filter((b) => b.verdict !== "met").map((b) => b.skillName).join(", ")}.
              You can still apply — many employers shortlist on trajectory.
            </p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setApplyTo(undefined)}>Cancel</Button>
            <Button onClick={submitApplication} disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              Submit application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
