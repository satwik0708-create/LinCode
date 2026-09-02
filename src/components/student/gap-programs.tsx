"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, GraduationCap, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { postJson } from "@/lib/client";
import { formatDate } from "@/lib/utils";

export interface GapProgramView {
  id: string;
  title: string;
  description: string;
  kind: string;
  level: string;
  mode: string;
  durationWeeks: number;
  seats: number;
  startsOn: string;
  certificateOffered: boolean;
  organizationName: string;
  closesSkills: string[];
  enrolled: boolean;
}

/**
 * Industry-published programmes that teach skills this student is short on.
 * The chips say which of *their* gaps each programme closes, so the list reads
 * as a recommendation rather than an advert.
 */
export function GapPrograms({ programs }: { programs: GapProgramView[] }) {
  if (programs.length === 0) return null;

  return (
    <section className="mt-6">
      <div className="mb-3 flex items-center gap-2">
        <GraduationCap className="size-4 text-muted-foreground" />
        <h2 className="text-lg font-semibold tracking-tight">Programmes that close this gap</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {programs.map((program) => (
          <ProgramCard key={program.id} program={program} />
        ))}
      </div>
    </section>
  );
}

function ProgramCard({ program }: { program: GapProgramView }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [enrolled, setEnrolled] = React.useState(program.enrolled);
  const [error, setError] = React.useState<string>();

  async function enroll() {
    setPending(true);
    setError(undefined);
    const result = await postJson("/api/training/enroll", { programId: program.id });
    setPending(false);
    if (!result.ok) {
      setError(result.error ?? "Could not enrol.");
      return;
    }
    setEnrolled(true);
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="capitalize">{program.kind}</Badge>
          <Badge variant="muted" className="capitalize">{program.level}</Badge>
          {program.certificateOffered && <Badge variant="success">Certificate</Badge>}
        </div>
        <div>
          <h3 className="font-semibold">{program.title}</h3>
          <p className="text-xs text-muted-foreground">{program.organizationName}</p>
          <p className="mt-1 text-sm text-muted-foreground">{program.description}</p>
        </div>
        <div>
          <p className="text-xs font-medium">Closes your gap in</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {program.closesSkills.map((skill) => (
              <Badge key={skill} variant="muted" className="text-[11px]">{skill}</Badge>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
          <p className="text-[11px] text-muted-foreground">
            {program.durationWeeks} weeks · {program.mode.replace("_", " ")} · starts {formatDate(program.startsOn)}
          </p>
          {enrolled ? (
            <Badge variant="success" className="gap-1"><Check className="size-3" />Enrolled</Badge>
          ) : (
            <Button size="sm" onClick={enroll} disabled={pending}>
              {pending && <Loader2 className="size-3.5 animate-spin" />}
              Enrol
            </Button>
          )}
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
