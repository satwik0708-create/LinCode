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
import { postJson } from "@/lib/client";

export interface SkillOption { id: string; name: string; domainIds: string[] }
export interface DomainOption { id: string; name: string }

const DEGREES = ["B.Tech", "B.E.", "B.Sc", "BCA", "M.Tech", "M.Sc", "MCA", "Diploma"];
const BRANCHES = [
  "Computer Engineering", "Computer Science", "Information Technology",
  "Electronics & Communication", "Electrical", "Mechanical", "Civil",
];

/**
 * Recruiter posting form. Required skills are chosen from the shared taxonomy
 * so a posting can be matched against a student's skill matrix — free text
 * would make matching impossible.
 */
export function PostOpportunityDialog({
  type, domains, skills, triggerLabel,
}: {
  type: "internship" | "job" | "project" | "apprenticeship";
  domains: DomainOption[];
  skills: SkillOption[];
  triggerLabel: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string>();
  const [fields, setFields] = React.useState<Record<string, string>>({});

  const [form, setForm] = React.useState({
    title: "", description: "", location: "", workMode: "onsite" as "onsite" | "remote" | "hybrid",
    stipend: "", salaryLpa: "", durationMonths: "", openings: "1",
    deadline: new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10),
    minCgpa: "",
  });
  const [selectedDomains, setSelectedDomains] = React.useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = React.useState<string[]>([]);
  const [mandatorySkills, setMandatorySkills] = React.useState<string[]>([]);
  const [degrees, setDegrees] = React.useState<string[]>([]);
  const [branches, setBranches] = React.useState<string[]>([]);
  const [years, setYears] = React.useState<number[]>([new Date().getFullYear() + 1]);

  const relevantSkills = React.useMemo(
    () => (selectedDomains.length === 0 ? skills : skills.filter((s) => s.domainIds.some((d) => selectedDomains.includes(d)))),
    [skills, selectedDomains],
  );

  function toggle<T>(list: T[], value: T, setter: (next: T[]) => void) {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(undefined);
    setFields({});

    const result = await postJson("/api/opportunities/create", {
      type,
      title: form.title,
      description: form.description,
      location: form.location,
      workMode: form.workMode,
      stipend: form.stipend || undefined,
      salaryLpa: form.salaryLpa || undefined,
      durationMonths: form.durationMonths ? Number(form.durationMonths) : undefined,
      domainIds: selectedDomains,
      skillIds: selectedSkills,
      mandatorySkillIds: mandatorySkills,
      degrees, branches, graduationYears: years,
      minCgpa: form.minCgpa ? Number(form.minCgpa) : undefined,
      openings: Number(form.openings),
      deadline: form.deadline,
    });

    setPending(false);
    if (!result.ok) {
      setError(result.error ?? "Could not create the posting.");
      setFields(result.fields ?? {});
      return;
    }

    setOpen(false);
    router.refresh();
  }

  const yearOptions = Array.from({ length: 4 }, (_, i) => new Date().getFullYear() + i);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="size-4" />{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Post {type === "internship" ? "an internship" : `a ${type}`}</DialogTitle>
          <DialogDescription>
            Required skills come from the shared taxonomy so students see an honest per-skill match, not a guess.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-5" noValidate>
          {error && <FormAlert tone="error">{error}</FormAlert>}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="op-title" label="Title" error={fields.title} className="sm:col-span-2">
              <Input id="op-title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Frontend Developer Intern" />
            </Field>
            <Field id="op-description" label="Description" error={fields.description} className="sm:col-span-2">
              <Textarea id="op-description" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What the role involves, what they will own, and who they will work with." />
            </Field>
            <Field id="op-location" label="Location" error={fields.location}>
              <Input id="op-location" required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Bengaluru" />
            </Field>
            <Field id="op-mode" label="Work mode">
              <select
                id="op-mode"
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={form.workMode}
                onChange={(e) => setForm({ ...form, workMode: e.target.value as typeof form.workMode })}
              >
                <option value="onsite">On site</option>
                <option value="hybrid">Hybrid</option>
                <option value="remote">Remote</option>
              </select>
            </Field>
            {type === "job" ? (
              <Field id="op-salary" label="Salary range">
                <Input id="op-salary" value={form.salaryLpa} onChange={(e) => setForm({ ...form, salaryLpa: e.target.value })} placeholder="₹8–11 LPA" />
              </Field>
            ) : (
              <Field id="op-stipend" label="Stipend">
                <Input id="op-stipend" value={form.stipend} onChange={(e) => setForm({ ...form, stipend: e.target.value })} placeholder="₹25,000/month" />
              </Field>
            )}
            <Field id="op-duration" label="Duration (months)">
              <Input id="op-duration" type="number" min={0} max={36} value={form.durationMonths} onChange={(e) => setForm({ ...form, durationMonths: e.target.value })} />
            </Field>
            <Field id="op-openings" label="Openings" error={fields.openings}>
              <Input id="op-openings" type="number" min={1} max={500} required value={form.openings} onChange={(e) => setForm({ ...form, openings: e.target.value })} />
            </Field>
            <Field id="op-deadline" label="Application deadline" error={fields.deadline}>
              <Input id="op-deadline" type="date" required value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            </Field>
          </div>

          <ChipGroup
            label="Domains" hint="Determines which skills you can require."
            options={domains.map((d) => ({ value: d.id, label: d.name }))}
            selected={selectedDomains}
            onToggle={(value) => toggle(selectedDomains, value, setSelectedDomains)}
            error={fields.domainIds}
          />

          <div className="space-y-2">
            <ChipGroup
              label="Required skills" hint="Click once to require, twice to mark as mandatory."
              options={relevantSkills.map((s) => ({ value: s.id, label: s.name }))}
              selected={selectedSkills}
              emphasised={mandatorySkills}
              onToggle={(value) => {
                if (mandatorySkills.includes(value)) {
                  setMandatorySkills(mandatorySkills.filter((s) => s !== value));
                  setSelectedSkills(selectedSkills.filter((s) => s !== value));
                } else if (selectedSkills.includes(value)) {
                  setMandatorySkills([...mandatorySkills, value]);
                } else {
                  setSelectedSkills([...selectedSkills, value]);
                }
              }}
              error={fields.skillIds}
            />
            {mandatorySkills.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Mandatory: {mandatorySkills.length} · these carry double weight in the match score.
              </p>
            )}
          </div>

          <ChipGroup
            label="Eligible degrees" hint="Leave empty to accept any degree."
            options={DEGREES.map((d) => ({ value: d, label: d }))}
            selected={degrees}
            onToggle={(value) => toggle(degrees, value, setDegrees)}
          />

          <ChipGroup
            label="Eligible branches" hint="Leave empty to accept any branch."
            options={BRANCHES.map((b) => ({ value: b, label: b }))}
            selected={branches}
            onToggle={(value) => toggle(branches, value, setBranches)}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <ChipGroup
              label="Graduating batches"
              options={yearOptions.map((y) => ({ value: String(y), label: String(y) }))}
              selected={years.map(String)}
              onToggle={(value) => toggle(years, Number(value), setYears)}
            />
            <Field id="op-cgpa" label="Minimum CGPA">
              <Input id="op-cgpa" type="number" step="0.1" min={0} max={10} value={form.minCgpa} onChange={(e) => setForm({ ...form, minCgpa: e.target.value })} placeholder="7.0" />
            </Field>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={pending || selectedSkills.length === 0 || selectedDomains.length === 0}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              Publish posting
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
