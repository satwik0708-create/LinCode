"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Multi-select chips used by the recruiter posting forms. `emphasised` marks a
 * second, stronger state on top of selection — the posting form uses it for
 * mandatory skills.
 */
export function ChipGroup({
  label, hint, options, selected, emphasised = [], onToggle, error,
}: {
  label: string;
  hint?: string;
  options: Array<{ value: string; label: string }>;
  selected: string[];
  emphasised?: string[];
  onToggle: (value: string) => void;
  error?: string;
}) {
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-baseline gap-2">
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        {selected.length > 0 && <Badge variant="muted" className="ml-auto">{selected.length}</Badge>}
      </div>
      <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto scrollbar-thin">
        {options.map((option) => {
          const active = selected.includes(option.value);
          const strong = emphasised.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onToggle(option.value)}
              aria-pressed={active}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs transition-colors",
                strong
                  ? "border-primary bg-primary font-semibold text-primary-foreground"
                  : active
                    ? "border-primary bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-accent",
              )}
            >
              {option.label}
              {strong && <span className="ml-1">*</span>}
            </button>
          );
        })}
      </div>
      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </div>
  );
}
