"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { postJson } from "@/lib/client";
import { cn, formatDate } from "@/lib/utils";
import type { ApplicationEvent, ApplicationStage } from "@/lib/types";

interface Row {
  id: string;
  title: string;
  type: string;
  organizationName: string;
  location: string;
  stage: ApplicationStage;
  matchScore: number;
  createdAt: string;
  updatedAt: string;
  timeline: ApplicationEvent[];
  coverNote?: string;
}

/** The lifecycle every application walks. Terminal states sit outside it. */
const PIPELINE: ApplicationStage[] = ["applied", "under_review", "shortlisted", "interview", "selected"];

const STAGE_LABEL: Record<ApplicationStage, string> = {
  applied: "Applied",
  under_review: "Under review",
  shortlisted: "Shortlisted",
  interview: "Interview",
  selected: "Selected",
  rejected: "Not selected",
  withdrawn: "Withdrawn",
};

export function ApplicationTracker({ rows }: { rows: Row[] }) {
  const active = rows.filter((r) => !["rejected", "withdrawn", "selected"].includes(r.stage));
  const closed = rows.filter((r) => ["rejected", "withdrawn"].includes(r.stage));
  const offers = rows.filter((r) => r.stage === "selected");

  return (
    <Tabs defaultValue="active">
      <TabsList>
        <TabsTrigger value="active">In progress ({active.length})</TabsTrigger>
        <TabsTrigger value="offers">Offers ({offers.length})</TabsTrigger>
        <TabsTrigger value="closed">Closed ({closed.length})</TabsTrigger>
        <TabsTrigger value="all">All ({rows.length})</TabsTrigger>
      </TabsList>

      {([["active", active], ["offers", offers], ["closed", closed], ["all", rows]] as const).map(([key, list]) => (
        <TabsContent key={key} value={key} className="space-y-3">
          {list.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Nothing here yet.</p>}
          {list.map((row) => <ApplicationRow key={row.id} row={row} />)}
        </TabsContent>
      ))}
    </Tabs>
  );
}

function ApplicationRow({ row }: { row: Row }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  const terminal = row.stage === "rejected" || row.stage === "withdrawn";
  const currentIndex = PIPELINE.indexOf(row.stage);

  async function withdraw() {
    setPending(true);
    await postJson("/api/applications/withdraw", { applicationId: row.id });
    setPending(false);
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="muted" className="capitalize">{row.type}</Badge>
              <Badge
                variant={
                  row.stage === "selected" ? "success"
                    : row.stage === "rejected" ? "destructive"
                      : row.stage === "interview" || row.stage === "shortlisted" ? "warning"
                        : "secondary"
                }
              >
                {STAGE_LABEL[row.stage]}
              </Badge>
            </div>
            <h3 className="mt-2 font-semibold">{row.title}</h3>
            <p className="text-sm text-muted-foreground">
              {row.organizationName} · {row.location}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold tabular-nums">{row.matchScore}%</p>
            <p className="text-[11px] text-muted-foreground">match at apply</p>
          </div>
        </div>

        {/* Lifecycle: Applied -> Under review -> Shortlisted -> Interview -> Selected */}
        {!terminal && (
          <ol className="mt-4 flex items-center gap-1">
            {PIPELINE.map((stage, index) => {
              const done = index <= currentIndex;
              return (
                <li key={stage} className="flex flex-1 flex-col gap-1.5">
                  <span className={cn("h-1 rounded-full transition-colors", done ? "bg-primary" : "bg-muted")} />
                  <span
                    className={cn(
                      "flex items-center gap-1 truncate text-[10px] sm:text-[11px]",
                      index === currentIndex ? "font-semibold text-foreground" : done ? "text-muted-foreground" : "text-muted-foreground/50",
                    )}
                  >
                    {index < currentIndex && <Check className="size-3 shrink-0" />}
                    <span className="truncate">{STAGE_LABEL[stage]}</span>
                  </span>
                </li>
              );
            })}
          </ol>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-3">
          <Button variant="ghost" size="sm" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
            <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
            History ({row.timeline.length})
          </Button>
          <span className="text-xs text-muted-foreground">
            Applied {formatDate(row.createdAt)} · updated {formatDate(row.updatedAt)}
          </span>
          {!terminal && row.stage !== "selected" && (
            <Button variant="ghost" size="sm" className="ml-auto text-destructive hover:text-destructive" onClick={withdraw} disabled={pending}>
              {pending && <Loader2 className="size-3.5 animate-spin" />}
              Withdraw
            </Button>
          )}
        </div>

        {open && (
          <ol className="mt-3 space-y-3 border-l pl-4">
            {row.timeline.map((event, index) => (
              <li key={`${event.stage}-${index}`} className="relative text-sm">
                <span className="absolute -left-[21px] top-1.5 size-2 rounded-full bg-primary" aria-hidden />
                <p className="font-medium">{STAGE_LABEL[event.stage]}</p>
                <p className="text-xs text-muted-foreground">{formatDate(event.at, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}</p>
                {event.note && <p className="mt-0.5 text-xs text-muted-foreground">{event.note}</p>}
              </li>
            ))}
            {row.coverNote && (
              <li className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Your note: </span>
                {row.coverNote}
              </li>
            )}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
