"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Building2, Loader2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FormAlert } from "@/components/auth/form-field";
import { Stepper, type Step } from "@/components/shell/stepper";
import { postJson } from "@/lib/client";

const STEPS: Step[] = [
  { id: "details", label: "Institution" },
  { id: "representative", label: "Representative" },
];

const TYPES = [
  ["university", "University"],
  ["college", "College"],
  ["autonomous", "Autonomous institute"],
  ["deemed", "Deemed university"],
  ["polytechnic", "Polytechnic"],
  ["iti", "ITI"],
] as const;

interface InstitutionDetails {
  institutionName: string;
  type: string;
  website: string;
  officialEmail: string;
  address: string;
  city: string;
  state: string;
  accreditation: string;
}

/**
 * Institutions register in two stages: the institution itself, then the person
 * acting for it. Keeping them apart matters because the institution record is
 * shared — students and faculty attach to it — while the representative record
 * belongs to one account.
 */
export function InstitutionOnboarding({
  accountName,
  accountEmail,
  existing,
}: {
  accountName: string;
  accountEmail: string;
  existing: InstitutionDetails | null;
}) {
  const router = useRouter();
  const [step, setStep] = React.useState<"details" | "representative">(existing ? "representative" : "details");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string>();
  const [fields, setFields] = React.useState<Record<string, string>>({});

  const [details, setDetails] = React.useState<InstitutionDetails>(
    existing ?? {
      institutionName: "", type: "college", website: "",
      officialEmail: "", address: "", city: "", state: "", accreditation: "",
    },
  );
  const [rep, setRep] = React.useState({
    fullName: accountName, officialEmail: accountEmail, mobile: "",
    designation: "", department: "", purpose: "",
  });

  async function submitDetails(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(undefined);
    setFields({});

    const result = await postJson("/api/onboarding/institution/details", {
      ...details,
      website: details.website || undefined,
      accreditation: details.accreditation || undefined,
    });
    setPending(false);

    if (!result.ok) {
      setError(result.error ?? "Could not save the institution.");
      setFields(result.fields ?? {});
      return;
    }
    setStep("representative");
  }

  async function submitRepresentative(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(undefined);
    setFields({});

    const result = await postJson<{ next?: string }>("/api/onboarding/institution/representative", {
      ...rep,
      department: rep.department || undefined,
    });

    if (!result.ok) {
      setError(result.error ?? "Could not save your details.");
      setFields(result.fields ?? {});
      setPending(false);
      return;
    }
    router.replace(result.data.next ?? "/institution/dashboard");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <Stepper steps={STEPS} current={step} />

      {error && <FormAlert tone="error">{error}</FormAlert>}

      {step === "details" ? (
        <form onSubmit={submitDetails} className="space-y-6" noValidate>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Register your institution</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Students and faculty attach to this record, and every analytic you see is scoped to it.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="size-4" />
                Institution
              </CardTitle>
              <CardDescription>How the institution is identified across the platform.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field id="institutionName" label="Name" error={fields.institutionName} className="sm:col-span-2">
                <Input
                  id="institutionName" required placeholder="Government College of Engineering, Pune"
                  value={details.institutionName}
                  onChange={(e) => setDetails({ ...details, institutionName: e.target.value })}
                />
              </Field>

              <Field id="type" label="Type" error={fields.type}>
                <select
                  id="type"
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={details.type}
                  onChange={(e) => setDetails({ ...details, type: e.target.value })}
                >
                  {TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </Field>

              <Field id="officialEmail" label="Official email" error={fields.officialEmail}>
                <Input
                  id="officialEmail" type="email" required placeholder="principal@college.edu"
                  value={details.officialEmail}
                  onChange={(e) => setDetails({ ...details, officialEmail: e.target.value })}
                />
              </Field>

              <Field id="website" label="Official website" error={fields.website} className="sm:col-span-2">
                <Input
                  id="website" type="url" placeholder="https://college.edu"
                  value={details.website}
                  onChange={(e) => setDetails({ ...details, website: e.target.value })}
                />
              </Field>

              <Field id="address" label="Address" error={fields.address} className="sm:col-span-2">
                <Input
                  id="address" required placeholder="Shivajinagar, Wellesley Road"
                  value={details.address}
                  onChange={(e) => setDetails({ ...details, address: e.target.value })}
                />
              </Field>

              <Field id="city" label="City" error={fields.city}>
                <Input
                  id="city" required placeholder="Pune"
                  value={details.city} onChange={(e) => setDetails({ ...details, city: e.target.value })}
                />
              </Field>

              <Field id="state" label="State" error={fields.state}>
                <Input
                  id="state" required placeholder="Maharashtra"
                  value={details.state} onChange={(e) => setDetails({ ...details, state: e.target.value })}
                />
              </Field>

              <Field
                id="accreditation" label="Accreditation / affiliation" error={fields.accreditation}
                className="sm:col-span-2"
                hint={<span className="text-xs text-muted-foreground">Optional</span>}
              >
                <Input
                  id="accreditation" placeholder="NAAC A++ · Affiliated to SPPU"
                  value={details.accreditation}
                  onChange={(e) => setDetails({ ...details, accreditation: e.target.value })}
                />
              </Field>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" size="lg" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              Continue
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </form>
      ) : (
        <form onSubmit={submitRepresentative} className="space-y-6" noValidate>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Your details</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              You are registering as {details.institutionName || "your institution"}&rsquo;s representative.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <UserRound className="size-4" />
                Representative
              </CardTitle>
              <CardDescription>Who to contact about this institution&rsquo;s account.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field id="fullName" label="Full name" error={fields.fullName}>
                <Input
                  id="fullName" required value={rep.fullName}
                  onChange={(e) => setRep({ ...rep, fullName: e.target.value })}
                />
              </Field>
              <Field id="repEmail" label="Official email" error={fields.officialEmail}>
                <Input
                  id="repEmail" type="email" required value={rep.officialEmail}
                  onChange={(e) => setRep({ ...rep, officialEmail: e.target.value })}
                />
              </Field>
              <Field id="mobile" label="Mobile number" error={fields.mobile}>
                <Input
                  id="mobile" type="tel" inputMode="tel" required placeholder="98765 43210"
                  value={rep.mobile} onChange={(e) => setRep({ ...rep, mobile: e.target.value })}
                />
              </Field>
              <Field id="designation" label="Designation" error={fields.designation}>
                <Input
                  id="designation" required placeholder="Head — Career Development Cell"
                  value={rep.designation} onChange={(e) => setRep({ ...rep, designation: e.target.value })}
                />
              </Field>
              <Field
                id="department" label="Department / cell" error={fields.department}
                hint={<span className="text-xs text-muted-foreground">Optional</span>}
              >
                <Input
                  id="department" placeholder="Placement Office"
                  value={rep.department} onChange={(e) => setRep({ ...rep, department: e.target.value })}
                />
              </Field>
              <Field id="purpose" label="Purpose of using the platform" error={fields.purpose} className="sm:col-span-2">
                <Textarea
                  id="purpose" required
                  placeholder="Track placement readiness across departments and connect students with recruiters."
                  value={rep.purpose} onChange={(e) => setRep({ ...rep, purpose: e.target.value.slice(0, 400) })}
                />
              </Field>
            </CardContent>
          </Card>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button type="button" variant="ghost" onClick={() => setStep("details")} disabled={pending}>
              <ArrowLeft className="size-4" />
              Institution details
            </Button>
            <Button type="submit" size="lg" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              Enter my dashboard
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
