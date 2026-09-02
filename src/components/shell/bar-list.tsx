import { cn } from "@/lib/utils";

export interface BarRow {
  label: string;
  value: number;
  hint?: string;
  tone?: "default" | "success" | "warning" | "destructive";
}

/**
 * Horizontal bar list. Deliberately built from the same tokens as the rest of
 * the app rather than a charting library, so analytics reads as one product and
 * every value is present as text as well as length.
 */
export function BarList({ rows, max, suffix = "", className }: {
  rows: BarRow[];
  max?: number;
  suffix?: string;
  className?: string;
}) {
  const ceiling = max ?? Math.max(1, ...rows.map((r) => r.value));

  return (
    <ul className={cn("space-y-3", className)}>
      {rows.map((row) => (
        <li key={row.label} className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate">{row.label}</span>
            <span className="shrink-0 font-semibold tabular-nums">
              {row.value}{suffix}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                row.tone === "success" && "bg-success",
                row.tone === "warning" && "bg-warning",
                row.tone === "destructive" && "bg-destructive",
                (!row.tone || row.tone === "default") && "bg-primary",
              )}
              style={{ width: `${Math.min(100, (row.value / ceiling) * 100)}%` }}
            />
          </div>
          {row.hint && <p className="text-xs text-muted-foreground">{row.hint}</p>}
        </li>
      ))}
    </ul>
  );
}
