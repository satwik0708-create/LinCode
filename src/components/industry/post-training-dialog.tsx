"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FormAlert } from "@/components/auth/form-field";
import { ChipGroup } from "@/components/industry/chip-group";
import type { DomainOption, SkillOption } from "@/components/industry/post-opportunity-dialog";
import { postJson } from "@/lib/client";

const KINDS = [
  { value: "training", label: "Training" },
  { value: "certification", label: "Certification" },
  { value: "workshop", label: "Workshop" },
  { value: "mentorship", label: "Mentorship" },
] as const;

const MODES = [
  { value: "self_paced", label: "Self paced" },
  { value: "cohort", label: "Cohort" },
  { value: "live", label: "Live" },
] as const;

const selectClass =
  "flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/**
 * Publishing a training programme is the same shape of task as posting a role,
 * so it is the same shape of form: the skills it teaches come from the shared
 * taxonomy, which is what lets a student's skill gap surface the programme that
 * closes it.
 */
export function PostTrainingDialog({
  domains, skills,
}: {
  domains: DomainOption[];
  skills: SkillOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string>();
  const [fields, setFields] = React.useState<Record<string, string>>({});

  const [form, setForm] = React.useState({
    title: "",
    description: "",
    kind: "training" as (typeof KINDS)[number]["value"],
    level: "beginner" as "beginner" | "intermediate" | "advanced",
    mode: "cohort" as (typeof MODES)[number]["value"],
    durationWeeks: "6",
    seats: "40",
    certificateOffered: true,
    startsOn: new Date(Date.now() + 21 * 86_400_000).toISOString().slice(0, 10),
  });
  const [selectedDomains, setSelectedDomains] = React.useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = React.useState<string[]>([]);

  const relevantSkills = React.useMemo(
    () =>
      selectedDomains.length === 0
        ? skills
        : skills.filter((s) => s.domainIds.some((d) => selectedDomains.includes(d))),
    [skills, selectedDomains],
  );

  function toggle(list: string[], value: string, setter: (next: string[]) => void) {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(undefined);
    setFields({});

    const result = await postJson("/api/training/create", {
      title: form.title,
      description: form.description,
      kind: form.kind,
      level: form.level,
      domainIds: selectedDomains,
      skillIds: selectedSkills,
      durationWeeks: Number(form.durationWeeks),
      mode: form.mode,
      certificateOffered: form.certificateOffered,
      seats: Number(form.seats),
      startsOn: form.startsOn,
    });

    setPending(false);
    if (!result.ok) {
      setError(result.error ?? "Could not publish the programme.");
      setFields(result.fields ?? {});
      return;
    }

    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="size-4" />Publish a programme</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Publish a training programme</DialogTitle>
          <DialogDescription>
            The skills you tag are matched against students&rsquo; measured gaps, so the right cohort finds it.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-5" noValidate>
          {error && <FormAlert tone="error">{error}</FormAlert>}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="tr-title" label="Title" error={fields.title} className="sm:col-span-2">
              <Input
                id="tr-title" required value={form.title} placeholder="Cloud Foundations Certification"
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </Field>
            <Field id="tr-description" label="Description" error={fields.description} className="sm:col-span-2">
              <Textarea
                id="tr-description" required value={form.description}
                placeholder="What the programme covers, how it is delivered, and what a participant can do at the end."
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </Field>
            <Field id="tr-kind" label="Kind">
              <select
                id="tr-kind" className={selectClass} value={form.kind}
                onChange={(e) => setForm({ ...form, kind: e.target.value as typeof form.kind })}
              >
                {KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
              </select>
            </Field>
            <Field id="tr-mode" label="Delivery">
              <select
                id="tr-mode" className={selectClass} value={form.mode}
                onChange={(e) => setForm({ ...form, mode: e.target.value as typeof form.mode })}
              >
                {MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </Field>
            <Field id="tr-level" label="Level" hint={<span className="text-xs text-muted-foreground">Who it is pitched at</span>}>
              <select
                id="tr-level" className={selectClass} value={form.level}
                onChange={(e) => setForm({ ...form, level: e.target.value as typeof form.level })}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </Field>
            <Field id="tr-duration" label="Duration (weeks)" error={fields.durationWeeks}>
              <Input
                id="tr-duration" type="number" min={1} max={104} required value={form.durationWeeks}
                onChange={(e) => setForm({ ...form, durationWeeks: e.target.value })}
              />
            </Field>
            <Field id="tr-seats" label="Seats" error={fields.seats}>
              <Input
                id="tr-seats" type="number" min={1} max={5000} required value={form.seats}
                onChange={(e) => setForm({ ...form, seats: e.target.value })}
              />
            </Field>
            <Field id="tr-starts" label="Starts on" error={fields.startsOn}>
              <Input
                id="tr-starts" type="date" required value={form.startsOn}
                onChange={(e) => setForm({ ...form, startsOn: e.target.value })}
              />
            </Field>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox" className="size-4 rounded border-input accent-primary"
              checked={form.certificateOffered}
              onChange={(e) => setForm({ ...form, certificateOffered: e.target.checked })}
            />
            Participants receive a certificate they can add to their portfolio
          </label>

          <ChipGroup
            label="Domains" hint="Determines which skills you can tag."
            options={domains.map((d) => ({ value: d.id, label: d.name }))}
            selected={selectedDomains}
            onToggle={(value) => toggle(selectedDomains, value, setSelectedDomains)}
            error={fields.domainIds}
          />

          <ChipGroup
            label="Skills taught" hint="What a participant walks away able to do."
            options={relevantSkills.map((s) => ({ value: s.id, label: s.name }))}
            selected={selectedSkills}
            onToggle={(value) => toggle(selectedSkills, value, setSelectedSkills)}
            error={fields.skillIds}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={pending || selectedSkills.length === 0 || selectedDomains.length === 0}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              Publish programme
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
