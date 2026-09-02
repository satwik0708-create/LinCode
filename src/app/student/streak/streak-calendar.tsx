"use client";

import { cn } from "@/lib/utils";

const WEEKS = 12;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Twelve-week activity heatmap. Every cell carries a title with the exact count
 * so the information is not locked inside the colour ramp.
 */
export function StreakCalendar({ history }: { history: Record<string, number> }) {
  const today = new Date();
  // Align the grid so the last column ends on today's weekday.
  const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (WEEKS * 7 - 1) - end.getUTCDay());

  const columns: Array<Array<{ key: string; count: number; future: boolean }>> = [];
  const cursor = new Date(start);

  for (let w = 0; w <= WEEKS; w++) {
    const column: Array<{ key: string; count: number; future: boolean }> = [];
    for (let d = 0; d < 7; d++) {
      const key = cursor.toISOString().slice(0, 10);
      column.push({ key, count: history[key] ?? 0, future: cursor > end });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    columns.push(column);
  }

  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex min-w-max gap-1">
        {columns.map((column, index) => {
          const firstOfMonth = column.find((c) => c.key.endsWith("-01"));
          return (
            <div key={index} className="flex flex-col gap-1">
              <span className="h-3 text-[9px] leading-3 text-muted-foreground">
                {firstOfMonth ? MONTHS[Number(firstOfMonth.key.slice(5, 7)) - 1] : ""}
              </span>
              {column.map((cell) => (
                <span
                  key={cell.key}
                  title={cell.future ? "" : `${cell.key}: ${cell.count} ${cell.count === 1 ? "activity" : "activities"}`}
                  className={cn(
                    "size-3 rounded-sm",
                    cell.future && "opacity-0",
                    !cell.future && cell.count === 0 && "bg-muted",
                    cell.count === 1 && "bg-warning/30",
                    cell.count === 2 && "bg-warning/55",
                    cell.count >= 3 && "bg-warning",
                  )}
                />
              ))}
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
        <span>Less</span>
        <span className="size-3 rounded-sm bg-muted" />
        <span className="size-3 rounded-sm bg-warning/30" />
        <span className="size-3 rounded-sm bg-warning/55" />
        <span className="size-3 rounded-sm bg-warning" />
        <span>More</span>
      </div>
    </div>
  );
}
