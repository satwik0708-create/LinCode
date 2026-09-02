"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { postJson } from "@/lib/client";

/** Re-runs the recommendation engine against the student's current evidence. */
export function RegeneratePathButton({ domainId }: { domainId: string }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function regenerate() {
    setPending(true);
    await postJson("/api/learning/path", { domainId });
    setPending(false);
    router.refresh();
  }

  return (
    <Button variant="outline" size="sm" onClick={regenerate} disabled={pending}>
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
      Regenerate path
    </Button>
  );
}
