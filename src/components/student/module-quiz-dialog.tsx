"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ClipboardCheck, Loader2, Target, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { FormAlert } from "@/components/auth/form-field";
import { postJson } from "@/lib/client";
import { cn } from "@/lib/utils";
import type { ModuleQuizReport } from "@/lib/types";

interface ClientQuestion {
  id: string;
  skillId: string;
  level: string;
  prompt: string;
  options: string[];
}

/**
 * The checkpoint that follows a completed module: a short quiz, then a report
 * naming the skills it found short and the modules that teach them.
 *
 * Both halves live in one dialog because they are one moment for the student —
 * answering and then finding out what it meant.
 */
export function ModuleQuizDialog({
  domainId, moduleId, moduleTitle, open, onOpenChange,
}: {
  domainId: string;
  moduleId: string;
  moduleTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string>();
  const [assessmentId, setAssessmentId] = React.useState<string>();
  const [questions, setQuestions] = React.useState<ClientQuestion[]>([]);
  const [answers, setAnswers] = React.useState<Record<string, number>>({});
  const [report, setReport] = React.useState<ModuleQuizReport>();

  // Fetch on open rather than on mount: a path with twelve modules should not
  // create twelve assessments the moment the page renders.
  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(undefined);
      setReport(undefined);
      setAnswers({});
      const result = await postJson<{ assessmentId?: string; questions?: ClientQuestion[] }>(
        "/api/learning/quiz/start",
        { domainId, moduleId },
      );
      if (cancelled) return;
      setLoading(false);
      if (!result.ok || !result.data.assessmentId) {
        setError(result.error ?? "Could not start the checkpoint.");
        return;
      }
      setAssessmentId(result.data.assessmentId);
      setQuestions(result.data.questions ?? []);
    })();

    return () => { cancelled = true; };
  }, [open, domainId, moduleId]);

  const answered = questions.filter((q) => answers[q.id] !== undefined).length;
  const allAnswered = questions.length > 0 && answered === questions.length;

  async function submit() {
    if (!assessmentId) return;
    setSubmitting(true);
    setError(undefined);
    const result = await postJson<{ report?: ModuleQuizReport }>("/api/learning/quiz/submit", {
      assessmentId,
      answers,
    });
    setSubmitting(false);
    if (!result.ok || !result.data.report) {
      setError(result.error ?? "Could not submit the checkpoint.");
      return;
    }
    setReport(result.data.report);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="size-4" />
            {report ? "Checkpoint report" : `Checkpoint — ${moduleTitle}`}
          </DialogTitle>
          <DialogDescription>
            {report
              ? "What this checkpoint found, and where to go next."
              : "A few questions on what you just covered. Your answers feed your skill profile."}
          </DialogDescription>
        </DialogHeader>

        {error && <FormAlert tone="error">{error}</FormAlert>}

        {loading && (
          <p className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Generating your checkpoint…
          </p>
        )}

        {!loading && !report && questions.length > 0 && (
          <div className="space-y-5">
            <div>
              <div className="mb-1.5 flex items-baseline justify-between text-xs text-muted-foreground">
                <span>Answered</span>
                <span className="tabular-nums">{answered} / {questions.length}</span>
              </div>
              <Progress value={(answered / questions.length) * 100} className="h-1.5" />
            </div>

            {questions.map((question, index) => (
              <fieldset key={question.id} className="space-y-2">
                <legend className="text-sm font-medium">
                  {index + 1}. {question.prompt}
                </legend>
                <div className="space-y-1.5">
                  {question.options.map((option, optionIndex) => {
                    const chosen = answers[question.id] === optionIndex;
                    return (
                      <label
                        key={optionIndex}
                        className={cn(
                          "flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2 text-sm transition-colors",
                          chosen ? "border-primary bg-primary/[0.06]" : "hover:bg-accent",
                        )}
                      >
                        <input
                          type="radio"
                          name={question.id}
                          className="mt-0.5 accent-primary"
                          checked={chosen}
                          onChange={() => setAnswers({ ...answers, [question.id]: optionIndex })}
                        />
                        <span>{option}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ))}

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Take it later</Button>
              <Button onClick={submit} disabled={!allAnswered || submitting}>
                {submitting && <Loader2 className="size-4 animate-spin" />}
                Submit checkpoint
              </Button>
            </DialogFooter>
          </div>
        )}

        {report && <QuizReport report={report} onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function QuizReport({ report, onClose }: { report: ModuleQuizReport; onClose: () => void }) {
  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{report.moduleTitle} · {report.domainName}</p>
            <p className="mt-1 text-sm">{report.summary}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-semibold tabular-nums">{report.scorePercent}%</p>
            <p className="text-xs text-muted-foreground">{report.correctCount} of {report.totalCount} correct</p>
          </div>
        </CardContent>
      </Card>

      <section>
        <div className="mb-2 flex items-center gap-2">
          <Target className="size-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Skill gaps this checkpoint found</h3>
          {report.gaps.length > 0 && <Badge variant="muted">{report.gaps.length}</Badge>}
        </div>
        {report.gaps.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            None — every skill this checkpoint covered came back at or above what the domain expects.
          </p>
        ) : (
          <ul className="space-y-3">
            {report.gaps.map((gap) => (
              <li key={gap.skillId} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-medium">{gap.skillName}</p>
                  <p className="text-xs tabular-nums text-muted-foreground">
                    {gap.score}% here · {gap.requiredScore}% expected
                  </p>
                </div>
                <Progress value={gap.score} className="mt-2 h-1.5" />
                <p className="mt-2 text-xs text-muted-foreground">
                  Missed {gap.missedCount} of {gap.totalCount} on this skill.
                  {gap.revisit.length > 0 && ` Revisit: ${gap.revisit.map((m) => m.title).join(", ")}.`}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {report.strengths.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-semibold">Held up well</h3>
          <div className="flex flex-wrap gap-1.5">
            {report.strengths.map((s) => (
              <Badge key={s.skillId} variant="success" className="text-[11px]">
                {s.skillName} · {s.score}%
              </Badge>
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className="mb-2 text-sm font-semibold">Your answers</h3>
        <ul className="space-y-3">
          {report.review.map((item) => (
            <li key={item.questionId} className="rounded-lg border p-3">
              <div className="flex items-start gap-2">
                {item.correct
                  ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                  : <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />}
                <div className="min-w-0">
                  <p className="text-sm font-medium">{item.prompt}</p>
                  {!item.correct && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      You chose: {item.chosenIndex === null ? "nothing" : item.options[item.chosenIndex]}
                    </p>
                  )}
                  <p className="mt-1 text-xs">
                    <span className="font-medium">Correct:</span> {item.options[item.correctIndex]}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.explanation}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <DialogFooter>
        <Button onClick={onClose}>Back to my path</Button>
      </DialogFooter>
    </div>
  );
}
