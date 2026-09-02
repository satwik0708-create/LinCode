"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormAlert } from "@/components/auth/form-field";
import { postJson } from "@/lib/client";
import { cn } from "@/lib/utils";

interface ClientQuestion {
  id: string;
  domainId: string;
  skillId: string;
  level: "beginner" | "intermediate" | "advanced";
  prompt: string;
  options: string[];
}

export interface AssessmentResultView {
  scorePercent: number;
  correctCount: number;
  totalCount: number;
  declaredLevel: string;
  placedLevel: string;
  skillScores: Record<string, number>;
}

/**
 * Diagnostic runner.
 *
 * Questions arrive without their answer key and grading happens on the server,
 * so nothing in this component can be inspected to find the right answers.
 */
export function AssessmentRunner({
  domainId,
  domainName,
  declaredLevel,
  onComplete,
  completeLabel = "Continue",
}: {
  domainId: string;
  domainName: string;
  declaredLevel: "beginner" | "intermediate" | "advanced";
  onComplete: (result: AssessmentResultView, explanation: string) => void;
  completeLabel?: string;
}) {
  const [phase, setPhase] = React.useState<"intro" | "running" | "grading" | "done">("intro");
  const [questions, setQuestions] = React.useState<ClientQuestion[]>([]);
  const [assessmentId, setAssessmentId] = React.useState<string>();
  const [answers, setAnswers] = React.useState<Record<string, number>>({});
  const [index, setIndex] = React.useState(0);
  const [error, setError] = React.useState<string>();
  const [pending, setPending] = React.useState(false);
  const [result, setResult] = React.useState<{ result: AssessmentResultView; explanation: string }>();

  async function start() {
    setPending(true);
    setError(undefined);

    const response = await postJson<{ assessmentId: string; questions: ClientQuestion[] }>(
      "/api/assessment/start",
      { domainId, declaredLevel },
    );
    setPending(false);

    if (!response.ok) {
      setError(response.error ?? "Could not start the assessment.");
      return;
    }
    setAssessmentId(response.data.assessmentId);
    setQuestions(response.data.questions);
    setIndex(0);
    setAnswers({});
    setPhase("running");
  }

  async function submit() {
    if (!assessmentId) return;
    setPhase("grading");
    setError(undefined);

    const response = await postJson<{ result: AssessmentResultView; explanation: string }>(
      "/api/assessment/submit",
      { assessmentId, answers },
    );

    if (!response.ok) {
      setError(response.error ?? "Could not submit your answers.");
      setPhase("running");
      return;
    }
    setResult({ result: response.data.result, explanation: response.data.explanation });
    setPhase("done");
  }

  if (phase === "intro") {
    return (
      <Card>
        <CardHeader>
          <Badge variant="secondary" className="w-fit">{domainName}</Badge>
          <CardTitle className="mt-2">Diagnostic assessment</CardTitle>
          <CardDescription>
            You said you are <strong className="text-foreground">{declaredLevel}</strong> in {domainName}. This short
            test checks that against the domain&rsquo;s competency map so your learning path starts in the right place —
            not too far back, not past a gap.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <FormAlert tone="error">{error}</FormAlert>}
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2.5"><span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />About 10 questions, roughly 10 minutes.</li>
            <li className="flex gap-2.5"><span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />Questions spread across the skills this domain requires.</li>
            <li className="flex gap-2.5"><span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />A low score is not a failure — it just means we start earlier.</li>
          </ul>
          <p className="flex items-start gap-2 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
            Answers are graded on the server. The correct answers are never sent to your browser.
          </p>
          <Button onClick={start} disabled={pending} size="lg" className="w-full sm:w-auto">
            {pending && <Loader2 className="size-4 animate-spin" />}
            Start assessment
            <ArrowRight className="size-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (phase === "done" && result) {
    const { result: r, explanation } = result;
    return (
      <Card>
        <CardHeader>
          <span className="flex size-11 items-center justify-center rounded-full bg-success/12 text-success">
            <CheckCircle2 className="size-5" />
          </span>
          <CardTitle className="mt-3">{domainName} diagnostic complete</CardTitle>
          <CardDescription>{explanation}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Score" value={`${r.scorePercent}%`} />
            <Stat label="Correct" value={`${r.correctCount} / ${r.totalCount}`} />
            <Stat label="Placed at" value={r.placedLevel} capitalize />
          </div>

          {Object.keys(r.skillScores).length > 0 && (
            <div className="space-y-2.5">
              <p className="text-sm font-medium">Where you scored</p>
              {Object.entries(r.skillScores)
                .sort((a, b) => b[1] - a[1])
                .map(([skillId, score]) => (
                  <div key={skillId} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{skillId}</span>
                      <span className="font-medium tabular-nums">{score}%</span>
                    </div>
                    <Progress
                      value={score}
                      indicatorClassName={score >= 75 ? "bg-success" : score >= 45 ? "bg-warning" : "bg-destructive"}
                    />
                  </div>
                ))}
            </div>
          )}

          <Button onClick={() => onComplete(r, explanation)} size="lg" className="w-full sm:w-auto">
            {completeLabel}
            <ArrowRight className="size-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  const question = questions[index];
  const answered = Object.keys(answers).length;
  const allAnswered = answered === questions.length;

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex items-center justify-between gap-3">
          <Badge variant="secondary">{domainName}</Badge>
          <span className="text-xs tabular-nums text-muted-foreground">
            Question {index + 1} of {questions.length}
          </span>
        </div>
        <Progress value={((index + (answers[question?.id ?? ""] !== undefined ? 1 : 0)) / questions.length) * 100} />
      </CardHeader>

      <CardContent className="space-y-5">
        {error && <FormAlert tone="error">{error}</FormAlert>}

        {question && (
          <>
            <fieldset>
              <legend className="text-base font-medium leading-relaxed">{question.prompt}</legend>
              <div className="mt-4 space-y-2">
                {question.options.map((option, optionIndex) => {
                  const selected = answers[question.id] === optionIndex;
                  return (
                    <label
                      key={optionIndex}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 text-sm transition-colors",
                        selected ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-accent/50",
                      )}
                    >
                      <input
                        type="radio"
                        name={question.id}
                        checked={selected}
                        onChange={() => setAnswers((prev) => ({ ...prev, [question.id]: optionIndex }))}
                        className="mt-0.5 size-4 shrink-0 accent-primary"
                      />
                      <span>{option}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div className="flex items-center justify-between gap-3 border-t pt-4">
              <Button variant="outline" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0}>
                <ArrowLeft className="size-4" />
                Back
              </Button>

              <span className="text-xs text-muted-foreground">{answered} of {questions.length} answered</span>

              {index < questions.length - 1 ? (
                <Button onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}>
                  Next
                  <ArrowRight className="size-4" />
                </Button>
              ) : (
                <Button onClick={submit} disabled={!allAnswered || phase === "grading"}>
                  {phase === "grading" && <Loader2 className="size-4 animate-spin" />}
                  Submit
                </Button>
              )}
            </div>

            {index === questions.length - 1 && !allAnswered && (
              <p className="text-xs text-muted-foreground">
                Answer every question before submitting — unanswered items are graded as incorrect otherwise.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, capitalize }: { label: string; value: string; capitalize?: boolean }) {
  return (
    <div className="rounded-xl border bg-muted/40 p-3.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-xl font-semibold tabular-nums", capitalize && "capitalize")}>{value}</p>
    </div>
  );
}
