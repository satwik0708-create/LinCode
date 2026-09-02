"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Loader2, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FormAlert } from "@/components/auth/form-field";
import { postJson } from "@/lib/client";
import { cn } from "@/lib/utils";

interface AdvisorAnswer {
  answer: string;
  bullets: string[];
  suggestedActions: Array<{ label: string; href: string }>;
  confidence: "high" | "medium" | "low";
}

interface Turn {
  id: string;
  question: string;
  answer?: AdvisorAnswer;
}

const SUGGESTED = [
  "What should I learn next?",
  "Am I ready for a frontend internship?",
  "What skills am I missing for a data analyst role?",
  "Which career path suits my current skill profile?",
  "How long until I finish this domain?",
];

export function AdvisorChat({
  domains, studentName,
}: {
  domains: Array<{ id: string; name: string }>;
  studentName: string;
}) {
  const [turns, setTurns] = React.useState<Turn[]>([]);
  const [question, setQuestion] = React.useState("");
  const [domainId, setDomainId] = React.useState<string>("");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string>();
  const endRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns]);

  async function ask(text: string) {
    const trimmed = text.trim();
    if (!trimmed || pending) return;

    const id = `${Date.now()}`;
    setTurns((prev) => [...prev, { id, question: trimmed }]);
    setQuestion("");
    setPending(true);
    setError(undefined);

    const result = await postJson<{ answer: AdvisorAnswer }>("/api/advisor", {
      question: trimmed,
      domainId: domainId || undefined,
    });
    setPending(false);

    if (!result.ok) {
      setError(result.error ?? "The advisor could not answer that.");
      setTurns((prev) => prev.filter((t) => t.id !== id));
      return;
    }
    setTurns((prev) => prev.map((t) => (t.id === id ? { ...t, answer: result.data.answer } : t)));
  }

  return (
    <Card className="flex min-h-[32rem] flex-col">
      <CardContent className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex-1 space-y-4 overflow-y-auto scrollbar-thin" role="log" aria-live="polite">
          {turns.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-4 py-8 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Sparkles className="size-6" />
              </span>
              <div>
                <p className="font-medium">Ask me anything about your path, {studentName.split(" ")[0]}</p>
                <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                  I answer from your assessment results, skill gaps, learning progress and what employers are asking for right now.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTED.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => ask(prompt)}
                    className="rounded-full border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {turns.map((turn) => (
            <div key={turn.id} className="space-y-3">
              <div className="flex justify-end">
                <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2.5 text-sm text-primary-foreground">
                  {turn.question}
                </p>
              </div>

              {turn.answer ? (
                <div className="max-w-[92%] space-y-3 rounded-2xl rounded-bl-sm border bg-muted/40 px-4 py-3.5">
                  <p className="text-sm">{turn.answer.answer}</p>

                  {turn.answer.bullets.length > 0 && (
                    <ul className="space-y-1.5 text-sm text-muted-foreground">
                      {turn.answer.bullets.map((bullet, i) => (
                        <li key={i} className="flex gap-2.5">
                          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="flex flex-wrap items-center gap-2 border-t pt-3">
                    {turn.answer.suggestedActions.map((action) => (
                      <Button key={action.href} asChild size="sm" variant="outline">
                        <Link href={action.href}>{action.label}<ArrowRight className="size-3" /></Link>
                      </Button>
                    ))}
                    <Badge
                      variant={turn.answer.confidence === "high" ? "success" : "muted"}
                      className="ml-auto text-[10px]"
                    >
                      {turn.answer.confidence} confidence
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" />
                  Working through your skill profile…
                </div>
              )}
            </div>
          ))}
          <div ref={endRef} />
        </div>

        {error && <FormAlert tone="error">{error}</FormAlert>}

        <form
          onSubmit={(event) => { event.preventDefault(); ask(question); }}
          className="flex flex-col gap-2 border-t pt-4 sm:flex-row"
        >
          {domains.length > 0 && (
            <select
              value={domainId}
              onChange={(e) => setDomainId(e.target.value)}
              aria-label="Focus domain"
              className={cn(
                "h-10 shrink-0 rounded-lg border border-input bg-background px-3 text-sm shadow-sm",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:max-w-40",
              )}
            >
              <option value="">All domains</option>
              {domains.map((domain) => <option key={domain.id} value={domain.id}>{domain.name}</option>)}
            </select>
          )}
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about your skills, readiness or next step…"
            aria-label="Your question"
            maxLength={500}
          />
          <Button type="submit" disabled={pending || !question.trim()}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            <span className="sm:sr-only">Ask</span>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
