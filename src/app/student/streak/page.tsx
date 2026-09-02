import type { Metadata } from "next";
import { Flame } from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import { getStreak } from "@/lib/data/learning";
import { read } from "@/lib/data/store";
import { PageHeader } from "@/components/shell/page-header";
import { StatCard } from "@/components/shell/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StreakCalendar } from "./streak-calendar";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Learning Streak" };

const ACTIVITY_LABEL: Record<string, string> = {
  module_completed: "Completed a module",
  lesson_completed: "Completed a lesson",
  quiz_completed: "Completed a quiz",
  assessment_completed: "Completed an assessment",
  project_submitted: "Submitted a project",
};

export default async function StreakPage() {
  const user = await requireRole("student");
  const streak = await getStreak(user.id);

  const db = await read();
  const activities = db.streakActivities
    .filter((a) => a.userId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 12);

  const today = new Date().toISOString().slice(0, 10);
  const todayCount = streak.history[today] ?? 0;
  const thisWeek = Array.from({ length: 7 }, (_, i) =>
    new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10),
  ).reduce((sum, day) => sum + (streak.history[day] ?? 0), 0);
  const totalDays = Object.keys(streak.history).length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Learning Streak"
        description="A day counts when you actually learn something — completing a module, a quiz, an assessment or a project. Opening a page does not count."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="sm:col-span-2 lg:col-span-1">
          <CardContent className="flex items-center gap-4 p-5">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-warning/15 text-warning">
              <Flame className={streak.current > 0 ? "size-7 fill-current" : "size-7"} />
            </span>
            <div>
              <p className="text-3xl font-semibold leading-none tabular-nums">{streak.current}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                day{streak.current === 1 ? "" : "s"} in a row
              </p>
            </div>
          </CardContent>
        </Card>
        <StatCard label="Longest streak" value={`${streak.longest} days`} icon="Flame" tone="warning" />
        <StatCard label="Today" value={todayCount} icon="ClipboardCheck" hint={todayCount ? "You're covered for today" : "Nothing logged yet today"} tone={todayCount ? "success" : "default"} />
        <StatCard label="This week" value={thisWeek} icon="ListChecks" hint={`${totalDays} active days all time`} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Learning calendar</CardTitle>
          <CardDescription>The last twelve weeks. Darker means more activity that day.</CardDescription>
        </CardHeader>
        <CardContent>
          <StreakCalendar history={streak.history} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent activity</CardTitle>
          <CardDescription>Only qualifying learning actions appear here.</CardDescription>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing logged yet. Complete a module from your learning path to start a streak.
            </p>
          ) : (
            <ul className="divide-y">
              {activities.map((activity) => (
                <li key={activity.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{ACTIVITY_LABEL[activity.type] ?? activity.type}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.domainId ?? "—"} · {activity.minutes} min
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatDate(activity.day)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
