"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Stepper, STUDENT_STEPS } from "@/components/shell/stepper";
import { AssessmentRunner } from "@/components/student/assessment-runner";
import { Badge } from "@/components/ui/badge";

interface QueueItem {
  id: string;
  name: string;
  declaredLevel: "beginner" | "intermediate" | "advanced";
}

/**
 * Runs one diagnostic per domain, in sequence. Each domain has its own question
 * bank, so selecting Cybersecurity and Machine Learning produces two entirely
 * different tests.
 */
export function OnboardingAssessment({ queue }: { queue: QueueItem[] }) {
  const router = useRouter();
  const [position, setPosition] = React.useState(0);
  const current = queue[position];
  const last = position === queue.length - 1;

  function next() {
    if (last) {
      router.push("/onboarding/student/personalized-path");
      router.refresh();
      return;
    }
    setPosition((p) => p + 1);
  }

  if (!current) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <Stepper steps={STUDENT_STEPS} current="assessment" />

      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Let&rsquo;s find your real level</h1>
          {queue.length > 1 && (
            <Badge variant="secondary">Domain {position + 1} of {queue.length}</Badge>
          )}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {queue.length > 1
            ? "Each domain has its own diagnostic, drawn from its own competency map."
            : "One short diagnostic, drawn from this domain's competency map."}
        </p>
      </div>

      <AssessmentRunner
        key={current.id}
        domainId={current.id}
        domainName={current.name}
        declaredLevel={current.declaredLevel}
        onComplete={next}
        completeLabel={last ? "See my personalised path" : `Continue to ${queue[position + 1]?.name}`}
      />
    </div>
  );
}
