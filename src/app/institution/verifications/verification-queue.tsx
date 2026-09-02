"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, FileText, Link2, Loader2, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shell/empty-state";
import { postJson } from "@/lib/client";
import { formatDate } from "@/lib/utils";

export interface PendingRow {
  id: string;
  studentId: string;
  studentName: string;
  name: string;
  issuer: string;
  issuedOn: string;
  credentialId?: string;
  credentialUrl?: string;
  documentId?: string;
  submittedAt?: string;
  skills: string[];
}

export function VerificationQueue({ items }: { items: PendingRow[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon="ShieldCheck"
        title="Nothing waiting"
        description="When a student submits a certificate as evidence, it appears here for review."
      />
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => <ReviewCard key={item.id} item={item} />)}
    </div>
  );
}

function ReviewCard({ item }: { item: PendingRow }) {
  const router = useRouter();
  const [pending, setPending] = React.useState<"approve" | "reject" | null>(null);
  const [note, setNote] = React.useState("");
  const [error, setError] = React.useState<string>();
  const [done, setDone] = React.useState<"verified" | "rejected" | null>(null);

  async function review(approve: boolean) {
    setPending(approve ? "approve" : "reject");
    setError(undefined);
    const result = await postJson("/api/portfolio/certifications/review", {
      certificationId: item.id,
      approve,
      note: note.trim() || undefined,
    });
    setPending(null);
    if (!result.ok) {
      setError(result.error ?? "Could not record that decision.");
      return;
    }
    setDone(approve ? "verified" : "rejected");
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold">{item.name}</h3>
            <p className="text-sm text-muted-foreground">
              {item.issuer} · issued {formatDate(item.issuedOn)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Submitted by {item.studentName}
              {item.submittedAt && ` · ${formatDate(item.submittedAt)}`}
            </p>
          </div>
          {done && (
            <Badge variant={done === "verified" ? "success" : "destructive"}>
              {done === "verified" ? "Verified" : "Not verified"}
            </Badge>
          )}
        </div>

        {item.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {item.skills.map((skill) => (
              <Badge key={skill} variant="muted" className="text-[11px]">{skill}</Badge>
            ))}
          </div>
        )}

        {item.credentialId && (
          <p className="text-xs text-muted-foreground">Credential ID: {item.credentialId}</p>
        )}

        <div className="flex flex-wrap items-center gap-2 border-t pt-3">
          {item.documentId && (
            <Button asChild size="sm" variant="outline">
              <a href={`/api/documents/${item.documentId}/content`} target="_blank" rel="noopener noreferrer">
                <FileText className="size-3.5" />
                Open certificate
              </a>
            </Button>
          )}
          {item.credentialUrl && (
            <Button asChild size="sm" variant="ghost">
              <a href={item.credentialUrl} target="_blank" rel="noopener noreferrer">
                <Link2 className="size-3.5" />
                Issuer&rsquo;s verification page
              </a>
            </Button>
          )}
        </div>

        {!done && (
          <div className="flex flex-wrap items-center gap-2">
            <Input
              aria-label={`Note on ${item.name}`}
              placeholder="Optional note — required reading if you reject it"
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 400))}
              className="min-w-48 flex-1"
            />
            <Button size="sm" onClick={() => review(true)} disabled={pending !== null}>
              {pending === "approve" ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
              Verify
            </Button>
            <Button size="sm" variant="outline" onClick={() => review(false)} disabled={pending !== null}>
              {pending === "reject" ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
              Reject
            </Button>
          </div>
        )}

        {error && <p className="text-xs text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
