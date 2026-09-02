"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Loader2, MapPin, Search, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { FormAlert } from "@/components/auth/form-field";
import { EmptyState } from "@/components/shell/empty-state";
import { postJson } from "@/lib/client";
import { formatDate, relativeDays } from "@/lib/utils";

export interface ProgramRow {
  id: string;
  kind: string;
  kindLabel: string;
  title: string;
  description: string;
  organizationName: string;
  mode: string;
  location: string;
  startsOn: string;
  durationWeeks: number;
  seats: number;
  stipend?: string;
  focusAreas: string[];
  deadline: string;
  applied: boolean;
  appliedStage?: string;
}

/**
 * Shared listing for collaboration programmes. Used by the faculty portal for
 * FDPs, internships, training, research and the wider collaboration surface —
 * the caller decides which kinds to pass in.
 */
export function ProgramBoard({
  programs, emptyTitle, emptyDescription, searchable = true,
}: {
  programs: ProgramRow[];
  emptyTitle: string;
  emptyDescription: string;
  searchable?: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [applyTo, setApplyTo] = React.useState<ProgramRow>();
  const [note, setNote] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string>();

  const filtered = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return programs;
    return programs.filter(
      (p) =>
        p.title.toLowerCase().includes(needle) ||
        p.organizationName.toLowerCase().includes(needle) ||
        p.focusAreas.some((f) => f.toLowerCase().includes(needle)),
    );
  }, [programs, query]);

  async function submit() {
    if (!applyTo) return;
    setPending(true);
    setError(undefined);

    const result = await postJson("/api/programs/apply", {
      programId: applyTo.id,
      note: note.trim() || undefined,
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
      {searchable && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, company or focus area"
            className="pl-9"
            aria-label="Search programmes"
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState icon="Handshake" title={emptyTitle} description={emptyDescription} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((program) => (
            <Card key={program.id} className="flex flex-col">
              <CardContent className="flex flex-1 flex-col gap-3.5 p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <Badge variant="secondary">{program.kindLabel}</Badge>
                  {program.applied && (
                    <Badge variant="success" className="capitalize">
                      {program.appliedStage?.replace("_", " ") ?? "Applied"}
                    </Badge>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold leading-tight">{program.title}</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">{program.organizationName}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{program.description}</p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {program.focusAreas.map((area) => (
                    <Badge key={area} variant="muted" className="text-[11px]">{area}</Badge>
                  ))}
                </div>

                <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 border-t pt-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="size-3 shrink-0" />
                    <span className="truncate">{program.location} · {program.mode}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="size-3 shrink-0" />
                    <span>Starts {formatDate(program.startsOn)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="size-3 shrink-0" />
                    <span>{program.seats} seats · {program.durationWeeks}w</span>
                  </div>
                  <div className="truncate">{program.stipend ?? "No stipend listed"}</div>
                </dl>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <span className="text-xs text-muted-foreground">Applications close {relativeDays(program.deadline)}</span>
                  {program.applied ? (
                    <Button size="sm" variant="secondary" disabled>Applied</Button>
                  ) : (
                    <Button size="sm" onClick={() => { setApplyTo(program); setNote(""); setError(undefined); }}>
                      Apply
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!applyTo} onOpenChange={(open) => !open && setApplyTo(undefined)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply to {applyTo?.title}</DialogTitle>
            <DialogDescription>
              {applyTo?.organizationName} · {applyTo?.durationWeeks} weeks from {applyTo && formatDate(applyTo.startsOn)}
            </DialogDescription>
          </DialogHeader>

          {error && <FormAlert tone="error">{error}</FormAlert>}

          <div className="space-y-1.5">
            <label htmlFor="program-note" className="text-sm font-medium">
              Note to the organiser <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <Textarea
              id="program-note"
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 1500))}
              placeholder="Why this programme fits your teaching, research or industry goals."
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setApplyTo(undefined)}>Cancel</Button>
            <Button onClick={submit} disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              Submit application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
