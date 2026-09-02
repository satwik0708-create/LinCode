"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { FormAlert } from "@/components/auth/form-field";
import { DomainIcon } from "@/components/student/domain-icon";
import { postJson } from "@/lib/client";
import { cn } from "@/lib/utils";

type Level = "beginner" | "intermediate" | "advanced";

interface AvailableDomain {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  gradient: string;
  estimatedWeeks: number;
  moduleCount: number;
  topSkills: string[];
}

export function AddDomainPanel({ domains }: { domains: AvailableDomain[] }) {
  const router = useRouter();
  const [openFor, setOpenFor] = React.useState<string>();
  const [level, setLevel] = React.useState<Level>("beginner");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string>();

  async function add(domainId: string) {
    setPending(true);
    setError(undefined);

    const result = await postJson<{ next?: string }>("/api/learning/domains", { domainId, level });
    if (!result.ok) {
      setError(result.error ?? "Could not add that domain.");
      setPending(false);
      return;
    }
    router.push(result.data.next ?? "/student/learning");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {error && <FormAlert tone="error">{error}</FormAlert>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {domains.map((domain) => {
          const open = openFor === domain.id;
          return (
            <Card key={domain.id} className="flex flex-col overflow-hidden">
              <span className={cn("h-1 w-full bg-gradient-to-r", domain.gradient)} aria-hidden />
              <CardContent className="flex flex-1 flex-col gap-3 p-5">
                <span className={cn("flex size-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm", domain.gradient)}>
                  <DomainIcon name={domain.icon} className="size-4.5 h-[18px] w-[18px]" />
                </span>
                <div className="flex-1">
                  <h3 className="font-semibold">{domain.name}</h3>
                  <p className="mt-0.5 text-xs font-medium text-primary">{domain.tagline}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{domain.description}</p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {domain.topSkills.slice(0, 3).map((skill) => (
                    <Badge key={skill} variant="muted" className="text-[11px]">{skill}</Badge>
                  ))}
                </div>

                <p className="text-[11px] text-muted-foreground">
                  {domain.moduleCount} modules · ~{domain.estimatedWeeks} weeks
                </p>

                {open ? (
                  <div className="space-y-2 border-t pt-3">
                    <p className="text-xs font-medium">Your level in {domain.name}</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(["beginner", "intermediate", "advanced"] as Level[]).map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setLevel(option)}
                          aria-pressed={level === option}
                          className={cn(
                            "rounded-lg border px-2 py-1.5 text-[11px] font-medium capitalize transition-colors",
                            level === option ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent",
                          )}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {level === "beginner" ? "You'll go straight to the beginner path." : "A short diagnostic will confirm your starting point."}
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1" onClick={() => add(domain.id)} disabled={pending}>
                        {pending && <Loader2 className="size-3.5 animate-spin" />}
                        Add domain
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setOpenFor(undefined)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" className="w-full" onClick={() => { setOpenFor(domain.id); setLevel("beginner"); }}>
                    <Plus className="size-3.5" />
                    Add to my learning
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
