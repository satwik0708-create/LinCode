"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Paperclip, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FormAlert } from "@/components/auth/form-field";
import { ChipGroup } from "@/components/industry/chip-group";
import { postForm, postJson } from "@/lib/client";

export interface CertSkillOption { id: string; name: string }

const ACCEPT = "application/pdf,image/png,image/jpeg";
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Add a certification, optionally with the certificate itself attached.
 *
 * The upload is what turns a claim into something reviewable: with a file the
 * entry goes to the institution's verification queue, without one it stays
 * self-reported and is labelled as such everywhere it appears.
 */
export function AddCertificationDialog({ skills }: { skills: CertSkillOption[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string>();
  const [fields, setFields] = React.useState<Record<string, string>>({});
  const [file, setFile] = React.useState<File | null>(null);
  const [selectedSkills, setSelectedSkills] = React.useState<string[]>([]);
  const [form, setForm] = React.useState({
    name: "", issuer: "", issuedOn: new Date().toISOString().slice(0, 10),
    credentialId: "", credentialUrl: "",
  });

  function reset() {
    setForm({ name: "", issuer: "", issuedOn: new Date().toISOString().slice(0, 10), credentialId: "", credentialUrl: "" });
    setSelectedSkills([]);
    setFile(null);
    setFields({});
    setError(undefined);
  }

  function pickFile(event: React.ChangeEvent<HTMLInputElement>) {
    const chosen = event.target.files?.[0] ?? null;
    setFields((prev) => ({ ...prev, file: "" }));
    if (chosen && chosen.size > MAX_BYTES) {
      setFile(null);
      setFields((prev) => ({ ...prev, file: "That file is over 5 MB." }));
      return;
    }
    setFile(chosen);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(undefined);
    setFields({});

    // Upload first: a claim is only worth writing once its evidence is stored.
    let documentId: string | undefined;
    if (file) {
      const body = new FormData();
      body.set("file", file);
      body.set("kind", "certificate");
      const upload = await postForm<{ document?: { id: string } }>("/api/documents/upload", body);
      if (!upload.ok || !upload.data.document) {
        setPending(false);
        setError(upload.error ?? "Could not upload the certificate.");
        setFields(upload.fields ?? {});
        return;
      }
      documentId = upload.data.document.id;
    }

    const result = await postJson("/api/portfolio/certifications", {
      name: form.name,
      issuer: form.issuer,
      issuedOn: form.issuedOn,
      credentialId: form.credentialId || undefined,
      credentialUrl: form.credentialUrl || undefined,
      skillIds: selectedSkills,
      documentId,
    });

    setPending(false);
    if (!result.ok) {
      setError(result.error ?? "Could not add the certification.");
      setFields(result.fields ?? {});
      return;
    }

    reset();
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="size-4" />Add certification</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add a certification</DialogTitle>
          <DialogDescription>
            Attach the certificate and your institution can verify it. Without one it stays marked self-reported.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-5" noValidate>
          {error && <FormAlert tone="error">{error}</FormAlert>}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="cert-name" label="Certification" error={fields.name} className="sm:col-span-2">
              <Input
                id="cert-name" required value={form.name} placeholder="AWS Certified Cloud Practitioner"
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>
            <Field id="cert-issuer" label="Issued by" error={fields.issuer}>
              <Input
                id="cert-issuer" required value={form.issuer} placeholder="Amazon Web Services"
                onChange={(e) => setForm({ ...form, issuer: e.target.value })}
              />
            </Field>
            <Field id="cert-date" label="Issued on" error={fields.issuedOn}>
              <Input
                id="cert-date" type="date" required value={form.issuedOn}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setForm({ ...form, issuedOn: e.target.value })}
              />
            </Field>
            <Field
              id="cert-credential" label="Credential ID" error={fields.credentialId}
              hint={<span className="text-xs text-muted-foreground">Optional</span>}
            >
              <Input
                id="cert-credential" value={form.credentialId} placeholder="AWS-CP-90213"
                onChange={(e) => setForm({ ...form, credentialId: e.target.value })}
              />
            </Field>
            <Field
              id="cert-url" label="Verification link" error={fields.credentialUrl}
              hint={<span className="text-xs text-muted-foreground">Optional</span>}
            >
              <Input
                id="cert-url" type="url" value={form.credentialUrl} placeholder="https://issuer.example.com/verify/..."
                onChange={(e) => setForm({ ...form, credentialUrl: e.target.value })}
              />
            </Field>
          </div>

          <Field
            id="cert-file" label="Certificate file" error={fields.file}
            hint={<span className="text-xs text-muted-foreground">PDF, PNG or JPEG · up to 5 MB</span>}
          >
            <input
              id="cert-file" type="file" accept={ACCEPT} onChange={pickFile}
              className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border file:border-input file:bg-background file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-accent"
            />
          </Field>
          {file && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Paperclip className="size-3" />
              {file.name} · {(file.size / 1024).toFixed(0)} KB — this goes to your institution for verification.
            </p>
          )}

          <ChipGroup
            label="Skills it evidences" hint="These are matched against your skill profile."
            options={skills.map((s) => ({ value: s.id, label: s.name }))}
            selected={selectedSkills}
            onToggle={(value) =>
              setSelectedSkills(
                selectedSkills.includes(value)
                  ? selectedSkills.filter((s) => s !== value)
                  : [...selectedSkills, value],
              )
            }
            error={fields.skillIds}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {file ? "Submit for verification" : "Add certification"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
