import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Step {
  id: string;
  label: string;
}

/**
 * Onboarding progress indicator. Current step is marked with a filled dot plus
 * a bold label; completed steps get a check. The state is never conveyed by
 * colour alone.
 */
export function Stepper({ steps, current, className }: { steps: Step[]; current: string; className?: string }) {
  const index = Math.max(0, steps.findIndex((s) => s.id === current));

  return (
    <nav aria-label="Onboarding progress" className={cn("w-full", className)}>
      <ol className="flex items-center gap-1.5 sm:gap-2">
        {steps.map((step, i) => {
          const done = i < index;
          const active = i === index;
          return (
            <li key={step.id} className="flex flex-1 items-center gap-1.5 sm:gap-2">
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span
                  className={cn(
                    "h-1 w-full rounded-full transition-colors",
                    done ? "bg-primary" : active ? "bg-primary/60" : "bg-muted",
                  )}
                />
                <span
                  className={cn(
                    "flex items-center gap-1 truncate text-[11px] sm:text-xs",
                    active ? "font-semibold text-foreground" : done ? "text-muted-foreground" : "text-muted-foreground/60",
                  )}
                >
                  {done && <Check className="size-3 shrink-0" aria-label="completed" />}
                  <span className="truncate">{step.label}</span>
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export const STUDENT_STEPS: Step[] = [
  { id: "profile", label: "Profile" },
  { id: "domains", label: "Domains" },
  { id: "level", label: "Level" },
  { id: "assessment", label: "Assessment" },
  { id: "path", label: "Your path" },
];
