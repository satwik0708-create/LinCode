"use client";

import * as React from "react";
import { Flame, Search, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn, initials } from "@/lib/utils";
import type { StudentRow } from "@/lib/services/institution";

type SortKey = "readiness" | "name" | "applications" | "progress";

export function StudentTable({
  students, branches, years,
}: {
  students: StudentRow[];
  branches: string[];
  years: number[];
}) {
  const [query, setQuery] = React.useState("");
  const [branch, setBranch] = React.useState("all");
  const [year, setYear] = React.useState("all");
  const [sort, setSort] = React.useState<SortKey>("readiness");

  const filtered = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    const list = students
      .filter((s) => (branch === "all" ? true : s.branch === branch))
      .filter((s) => (year === "all" ? true : String(s.graduationYear) === year))
      .filter((s) => !needle || s.name.toLowerCase().includes(needle) || s.branch.toLowerCase().includes(needle));

    return [...list].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "applications") return b.applications - a.applications;
      if (sort === "progress") {
        const avg = (s: StudentRow) =>
          s.domains.length ? s.domains.reduce((sum, d) => sum + d.progress, 0) / s.domains.length : 0;
        return avg(b) - avg(a);
      }
      return b.readiness - a.readiness;
    });
  }, [students, query, branch, year, sort]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or branch"
            className="pl-9"
            aria-label="Search students"
          />
        </div>
        <select
          value={branch} onChange={(e) => setBranch(e.target.value)} aria-label="Filter by branch"
          className="h-10 rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="all">All branches</option>
          {branches.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <select
          value={year} onChange={(e) => setYear(e.target.value)} aria-label="Filter by graduation year"
          className="h-10 rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="all">All batches</option>
          {years.map((y) => <option key={y} value={String(y)}>{y}</option>)}
        </select>
        <select
          value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label="Sort students"
          className="h-10 rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="readiness">Readiness</option>
          <option value="progress">Learning progress</option>
          <option value="applications">Applications</option>
          <option value="name">Name</option>
        </select>
      </div>

      <p className="text-sm text-muted-foreground">{filtered.length} of {students.length} students</p>

      <div className="space-y-3">
        {filtered.map((student) => (
          <Card key={student.id}>
            <CardContent className="p-4 sm:p-5">
              <div className="flex flex-wrap items-start gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xs font-semibold text-primary">
                  {initials(student.name)}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{student.name}</h3>
                    {student.streak > 0 && (
                      <Badge variant="warning" className="gap-1">
                        <Flame className="size-3" />{student.streak}d
                      </Badge>
                    )}
                    {student.verifiedCredentials > 0 && (
                      <Badge variant="success" className="gap-1">
                        <ShieldCheck className="size-3" />{student.verifiedCredentials} verified
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {student.degree} {student.branch} · {student.graduationYear}
                    {student.cgpa != null && ` · CGPA ${student.cgpa}`}
                  </p>
                </div>

                <div className="flex shrink-0 gap-5 text-right">
                  <div>
                    <p className={cn(
                      "text-xl font-semibold tabular-nums leading-none",
                      student.readiness >= 70 ? "text-success" : student.readiness >= 45 ? "text-warning" : "text-muted-foreground",
                    )}>
                      {student.readiness}%
                    </p>
                    <p className="text-[11px] text-muted-foreground">readiness</p>
                  </div>
                  <div>
                    <p className="text-xl font-semibold tabular-nums leading-none">{student.applications}</p>
                    <p className="text-[11px] text-muted-foreground">applications</p>
                  </div>
                  <div>
                    <p className="text-xl font-semibold tabular-nums leading-none text-success">{student.offers}</p>
                    <p className="text-[11px] text-muted-foreground">offers</p>
                  </div>
                </div>
              </div>

              {student.domains.length > 0 && (
                <div className="mt-4 grid gap-3 border-t pt-3 sm:grid-cols-2 lg:grid-cols-3">
                  {student.domains.map((domain) => (
                    <div key={domain.id} className="space-y-1">
                      <div className="flex items-baseline justify-between gap-2 text-xs">
                        <span className="truncate">{domain.name}</span>
                        <span className="shrink-0 tabular-nums text-muted-foreground">{domain.progress}%</span>
                      </div>
                      <Progress
                        value={domain.progress}
                        className="h-1.5"
                        indicatorClassName={domain.status === "completed" ? "bg-success" : undefined}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
