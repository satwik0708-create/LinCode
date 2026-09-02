import { Flame } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LearningStreak } from "@/lib/types";

function lastDays(count: number): string[] {
  return Array.from({ length: count }, (_, i) =>
    new Date(Date.now() - (count - 1 - i) * 86_400_000).toISOString().slice(0, 10),
  );
}

const WEEKDAY = ["S", "M", "T", "W", "T", "F", "S"];

export function StreakWidget({ streak, compact = false }: { streak: LearningStreak; compact?: boolean }) {
  const week = lastDays(7);
  const active = streak.current > 0;

  return (
    <Card>
      <CardContent className={cn("flex flex-col gap-4", compact ? "p-4" : "p-5")}>
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex size-11 items-center justify-center rounded-xl",
              active ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground",
            )}
          >
            <Flame className={cn("size-5", active && "fill-current")} />
          </span>
          <div>
            <p className="text-2xl font-semibold leading-none tabular-nums">
              {streak.current} <span className="text-sm font-normal text-muted-foreground">day{streak.current === 1 ? "" : "s"}</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {active ? "Current learning streak" : "Start a streak today"} · longest {streak.longest}
            </p>
          </div>
        </div>

        <div className="flex justify-between gap-1.5">
          {week.map((day, index) => {
            const count = streak.history[day] ?? 0;
            const weekday = new Date(`${day}T00:00:00Z`).getUTCDay();
            return (
              <div key={day} className="flex flex-1 flex-col items-center gap-1">
                <span
                  title={`${day}: ${count} ${count === 1 ? "activity" : "activities"}`}
                  className={cn(
                    "flex aspect-square w-full items-center justify-center rounded-md border text-[10px] font-semibold tabular-nums transition-colors",
                    count === 0 && "border-border bg-muted/60 text-muted-foreground/50",
                    count === 1 && "border-warning/40 bg-warning/20 text-warning",
                    count === 2 && "border-warning/60 bg-warning/40 text-warning",
                    count >= 3 && "border-warning bg-warning/70 text-warning-foreground",
                  )}
                >
                  {count > 0 ? count : ""}
                </span>
                <span className={cn("text-[10px]", index === 6 ? "font-semibold text-foreground" : "text-muted-foreground")}>
                  {WEEKDAY[weekday]}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
