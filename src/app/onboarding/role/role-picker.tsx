"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Briefcase, Building2, Check, GraduationCap, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/auth/form-field";
import { postJson } from "@/lib/client";
import { cn } from "@/lib/utils";

type SelectableRole = "student" | "faculty" | "industry" | "institution";

const ROLE_CARDS: Array<{
  value: SelectableRole;
  emoji: string;
  icon: typeof GraduationCap;
  title: string;
  description: string;
  bullets: string[];
  gradient: string;
}> = [
  {
    value: "student", emoji: "🎓", icon: GraduationCap, title: "Student",
    description: "For students looking to develop skills, find internships, and become placement-ready.",
    bullets: ["Skill assessment & gap analysis", "Personalised learning paths", "Internships, jobs and a verified portfolio"],
    gradient: "from-indigo-500 to-violet-500",
  },
  {
    value: "faculty", emoji: "🏛", icon: Users, title: "Faculty / Academician",
    description: "For faculty internships, FDPs, industrial training, consultancy and research collaboration.",
    bullets: ["Faculty internships & industrial training", "Faculty Development Programmes", "Consultancy and joint research"],
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    value: "industry", emoji: "💼", icon: Briefcase, title: "Industry / Recruiter",
    description: "For internships, jobs, projects, training programmes and recruitment.",
    bullets: ["Post roles with the exact skills you need", "Discover candidates by skill compatibility", "Run training and mentorship programmes"],
    gradient: "from-sky-500 to-cyan-500",
  },
  {
    value: "institution", emoji: "🏢", icon: Building2, title: "Institution",
    description: "For monitoring students, skill development, internships, placements and analytics.",
    bullets: ["Cohort skill development dashboards", "Internship and placement tracking", "Department-level gap analytics"],
    gradient: "from-amber-500 to-orange-500",
  },
];

export function RolePicker({ name }: { name: string }) {
  const router = useRouter();
  const [selected, setSelected] = React.useState<SelectableRole | null>(null);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string>();

  async function confirm() {
    if (!selected) return;
    setPending(true);
    setError(undefined);

    const result = await postJson<{ next?: string }>("/api/auth/role", { role: selected });
    if (!result.ok) {
      setError(result.error ?? "Could not set your role.");
      setPending(false);
      return;
    }
    router.replace(result.data.next ?? "/");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-medium text-primary">Welcome, {name.split(" ")[0]}</p>
        <h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          What are you registering as?
        </h1>
        <p className="mt-3 text-balance text-sm text-muted-foreground">
          This determines the workspace you get. You will only see the features for your role — the others stay closed,
          enforced on the server rather than hidden in the interface.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {ROLE_CARDS.map((role) => {
          const active = selected === role.value;
          return (
            <button
              key={role.value}
              type="button"
              onClick={() => setSelected(role.value)}
              aria-pressed={active}
              className={cn(
                "group relative overflow-hidden rounded-2xl border bg-card p-5 text-left transition-all sm:p-6",
                "hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                active ? "border-primary shadow-md ring-1 ring-primary" : "border-border",
              )}
            >
              <span
                className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r transition-opacity", role.gradient, active ? "opacity-100" : "opacity-0 group-hover:opacity-60")}
                aria-hidden
              />
              <div className="flex items-start justify-between gap-3">
                <span
                  className={cn(
                    "flex size-12 items-center justify-center rounded-xl text-2xl transition-colors",
                    active ? "bg-primary/10" : "bg-muted",
                  )}
                  aria-hidden
                >
                  {role.emoji}
                </span>
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full border transition-all",
                    active ? "border-primary bg-primary text-primary-foreground" : "border-border",
                  )}
                  aria-hidden
                >
                  {active && <Check className="size-3.5" />}
                </span>
              </div>

              <h2 className="mt-4 text-lg font-semibold">{role.title}</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">{role.description}</p>

              <ul className="mt-4 space-y-1.5 border-t pt-4 text-xs text-muted-foreground">
                {role.bullets.map((bullet) => (
                  <li key={bullet} className="flex gap-2">
                    <span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary" />
                    {bullet}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      {error && <div className="mx-auto mt-6 max-w-md"><FormAlert tone="error">{error}</FormAlert></div>}

      <div className="mt-8 flex flex-col items-center gap-3">
        <Button size="lg" className="w-full sm:w-auto sm:min-w-64" disabled={!selected || pending} onClick={confirm}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          Continue as {selected ? ROLE_CARDS.find((r) => r.value === selected)!.title : "…"}
          <ArrowRight className="size-4" />
        </Button>
        <p className="text-xs text-muted-foreground">
          Need a different role later? An administrator can grant it to your account.
        </p>
      </div>
    </div>
  );
}
