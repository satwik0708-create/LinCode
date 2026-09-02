"use client";

import * as React from "react";
import {
  Award, BadgeCheck, Boxes, BriefcaseBusiness, ExternalLink, FileText,
  GraduationCap, LayoutGrid, Link2, ShieldCheck, Sparkles, Target,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shell/empty-state";
import { cn, formatDate, initials } from "@/lib/utils";
import type { AcademicRecord, Achievement, Certification, PortfolioProject } from "@/lib/types";

type SectionId =
  | "overview" | "skills" | "certifications" | "projects"
  | "internships" | "achievements" | "resume" | "academic";

const SECTIONS: Array<{ id: SectionId; label: string; icon: typeof LayoutGrid }> = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "skills", label: "Skills", icon: Target },
  { id: "certifications", label: "Certifications", icon: BadgeCheck },
  { id: "projects", label: "Projects", icon: Boxes },
  { id: "internships", label: "Internships", icon: BriefcaseBusiness },
  { id: "achievements", label: "Achievements", icon: Award },
  { id: "resume", label: "Resume", icon: FileText },
  { id: "academic", label: "Academic Records", icon: GraduationCap },
];

interface SkillRow {
  id: string; name: string; score: number;
  strength: string; source: string; verified: boolean;
}

interface InternshipRow {
  id: string; title: string; organizationName: string; type: string;
  location: string; durationMonths?: number; selectedAt: string;
}

interface DocumentRow {
  id: string; kind: string; filename: string; sizeBytes: number; uploadedAt: string;
}

interface DomainRow {
  id: string; name: string; progress: number; status: string; level: string;
}

export function PortfolioWorkspace({
  student, skills, certifications, projects, achievements, academicRecords, documents, internships, domains,
}: {
  student: {
    name: string; headline?: string; about?: string; institutionName: string;
    degree: string; branch: string; graduationYear: number; cgpa?: number;
    location?: string; careerInterests: string[];
  };
  skills: SkillRow[];
  certifications: Certification[];
  projects: PortfolioProject[];
  achievements: Achievement[];
  academicRecords: AcademicRecord[];
  documents: DocumentRow[];
  internships: InternshipRow[];
  domains: DomainRow[];
}) {
  const [section, setSection] = React.useState<SectionId>("overview");

  const verifiedSkills = skills.filter((s) => s.verified).length;
  const counts: Record<SectionId, number | undefined> = {
    overview: undefined,
    skills: skills.length,
    certifications: certifications.length,
    projects: projects.length,
    internships: internships.length,
    achievements: achievements.length,
    resume: documents.filter((d) => d.kind === "resume").length,
    academic: academicRecords.length,
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
      {/*
        Subsection navigation. The current section is marked four ways at once —
        a filled accent bar, a tinted background, a filled icon chip and bolder
        type — so nobody has to guess which one they are viewing, and the state
        survives both themes and colour-vision differences.
      */}
      <nav aria-label="Portfolio sections" className="lg:sticky lg:top-20 lg:self-start">
        <ul className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-thin lg:flex-col lg:overflow-visible lg:pb-0">
          {SECTIONS.map((item) => {
            const active = section === item.id;
            const count = counts[item.id];
            return (
              <li key={item.id} className="shrink-0 lg:shrink">
                <button
                  type="button"
                  onClick={() => setSection(item.id)}
                  aria-current={active ? "true" : undefined}
                  className={cn(
                    "group relative flex w-full items-center gap-2.5 rounded-lg py-2.5 pl-3.5 pr-3 text-sm transition-all",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    active
                      ? "bg-primary/10 font-semibold text-primary shadow-sm"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "absolute inset-y-1.5 left-0 w-1 rounded-full bg-primary transition-all",
                      active ? "opacity-100" : "opacity-0",
                    )}
                    aria-hidden
                  />
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-md transition-colors",
                      active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-background",
                    )}
                  >
                    <item.icon className="size-3.5" />
                  </span>
                  <span className="truncate">{item.label}</span>
                  {count !== undefined && count > 0 && (
                    <span
                      className={cn(
                        "ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                        active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                      )}
                    >
                      {count}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="min-w-0 space-y-5">
        {section === "overview" && (
          <>
            <Card>
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
                <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-xl font-semibold text-primary">
                  {initials(student.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-semibold">{student.name}</h2>
                  {student.headline && <p className="mt-0.5 text-sm text-primary">{student.headline}</p>}
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {student.degree} {student.branch} · {student.institutionName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Graduating {student.graduationYear}
                    {student.cgpa != null && ` · CGPA ${student.cgpa}`}
                    {student.location && ` · ${student.location}`}
                  </p>
                  {student.about && <p className="mt-3 text-sm">{student.about}</p>}
                  {student.careerInterests.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {student.careerInterests.map((interest) => (
                        <Badge key={interest} variant="secondary">{interest}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <OverviewStat label="Skills tracked" value={skills.length} hint={`${verifiedSkills} verified`} />
              <OverviewStat label="Certifications" value={certifications.length} hint={`${certifications.filter((c) => c.verified).length} verified`} />
              <OverviewStat label="Projects" value={projects.length} hint={`${projects.filter((p) => p.verified).length} verified`} />
              <OverviewStat label="Internships secured" value={internships.length} hint="From your applications" />
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Learning domains</CardTitle>
                <CardDescription>Progress is independent per domain.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {domains.length === 0 && <p className="text-sm text-muted-foreground">No domains enrolled yet.</p>}
                {domains.map((domain) => (
                  <div key={domain.id} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate font-medium">{domain.name}</span>
                      <span className="flex shrink-0 items-center gap-2">
                        <Badge variant={domain.status === "completed" ? "success" : "muted"} className="capitalize">
                          {domain.status === "completed" ? "Completed" : domain.level}
                        </Badge>
                        <span className="tabular-nums text-xs text-muted-foreground">{domain.progress}%</span>
                      </span>
                    </div>
                    <Progress value={domain.progress} className="h-1.5" indicatorClassName={domain.status === "completed" ? "bg-success" : undefined} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}

        {section === "skills" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Skill matrix</CardTitle>
              <CardDescription>
                Every score traces back to its source. Assessment and institution-verified signals outrank self-reports.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {skills.length === 0 && <p className="text-sm text-muted-foreground">No skills recorded yet — take a diagnostic to start.</p>}
              {skills.map((skill) => (
                <div key={skill.id} className="space-y-1.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                    <span className="flex items-center gap-1.5 font-medium">
                      {skill.name}
                      {skill.verified && <ShieldCheck className="size-3.5 text-success" aria-label="verified" />}
                    </span>
                    <span className="flex items-center gap-2">
                      <Badge variant="muted" className="text-[10px] capitalize">{skill.source.replace("_", " ")}</Badge>
                      <span className="tabular-nums text-xs text-muted-foreground">{skill.score}%</span>
                    </span>
                  </div>
                  <Progress
                    value={skill.score}
                    className="h-1.5"
                    indicatorClassName={skill.score >= 75 ? "bg-success" : skill.score >= 45 ? "bg-warning" : "bg-destructive"}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {section === "certifications" && (
          <SectionList
            empty={{ icon: "GraduationCap", title: "No certifications yet", description: "Complete an industry training programme to add a verifiable certificate." }}
            items={certifications}
            render={(cert) => (
              <Card key={cert.id}>
                <CardContent className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold">{cert.name}</h3>
                      <p className="text-sm text-muted-foreground">{cert.issuer} · {formatDate(cert.issuedOn)}</p>
                    </div>
                    <VerifiedBadge verified={cert.verified} />
                  </div>
                  {cert.credentialId && <p className="mt-2 text-xs text-muted-foreground">Credential ID: {cert.credentialId}</p>}
                  {cert.credentialUrl && (
                    <Button asChild size="sm" variant="outline" className="mt-3">
                      <a href={cert.credentialUrl} target="_blank" rel="noopener noreferrer">
                        <Link2 className="size-3.5" />
                        Verify credential
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          />
        )}

        {section === "projects" && (
          <SectionList
            empty={{ icon: "Boxes", title: "No projects yet", description: "Finish a capstone from your learning path and it lands here." }}
            items={projects}
            render={(project) => (
              <Card key={project.id}>
                <CardContent className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h3 className="font-semibold">{project.title}</h3>
                    <VerifiedBadge verified={project.verified} />
                  </div>
                  <p className="mt-1.5 text-sm text-muted-foreground">{project.description}</p>
                  {project.highlights.length > 0 && (
                    <ul className="mt-3 space-y-1.5 text-sm">
                      {project.highlights.map((highlight) => (
                        <li key={highlight} className="flex gap-2.5 text-muted-foreground">
                          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {project.repoUrl && (
                      <Button asChild size="sm" variant="outline">
                        <a href={project.repoUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="size-3.5" />Repository
                        </a>
                      </Button>
                    )}
                    {project.liveUrl && (
                      <Button asChild size="sm" variant="outline">
                        <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="size-3.5" />Live
                        </a>
                      </Button>
                    )}
                    <span className="text-xs text-muted-foreground">Completed {formatDate(project.completedOn)}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          />
        )}

        {section === "internships" && (
          <SectionList
            empty={{ icon: "Briefcase", title: "No internships yet", description: "Internships you are selected for appear here automatically from your applications." }}
            items={internships}
            render={(internship) => (
              <Card key={internship.id}>
                <CardContent className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{internship.title}</h3>
                      <p className="text-sm text-muted-foreground">{internship.organizationName} · {internship.location}</p>
                    </div>
                    <Badge variant="success">Selected</Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {internship.durationMonths ? `${internship.durationMonths} months · ` : ""}
                    Offer {formatDate(internship.selectedAt)}
                  </p>
                </CardContent>
              </Card>
            )}
          />
        )}

        {section === "achievements" && (
          <SectionList
            empty={{ icon: "Award", title: "No achievements yet", description: "Competition results, hackathon placements and awards appear here." }}
            items={achievements}
            render={(achievement) => (
              <Card key={achievement.id}>
                <CardContent className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold">{achievement.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{achievement.description}</p>
                    </div>
                    <VerifiedBadge verified={achievement.verified} />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {achievement.awardedBy} · {formatDate(achievement.awardedOn)}
                  </p>
                </CardContent>
              </Card>
            )}
          />
        )}

        {section === "resume" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Documents</CardTitle>
              <CardDescription>
                Stored privately. A recruiter can only read a document you attached to an application for one of their own postings — every read is authorised on the server.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {documents.length === 0 && <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>}
              {documents.map((document) => (
                <div key={document.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <FileText className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{document.filename}</p>
                    <p className="text-xs text-muted-foreground">
                      {document.kind.replace("_", " ")} · {(document.sizeBytes / 1024).toFixed(0)} KB · {formatDate(document.uploadedAt)}
                    </p>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <a href={`/api/documents/${document.id}`}>Open</a>
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {section === "academic" && (
          <SectionList
            empty={{ icon: "GraduationCap", title: "No academic records yet", description: "Records pushed by your institution appear here and are marked as verified." }}
            items={academicRecords}
            render={(record) => (
              <Card key={record.id}>
                <CardContent className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{record.term}</h3>
                      <p className="text-sm text-muted-foreground">GPA {record.gpa} · {record.credits} credits</p>
                    </div>
                    <VerifiedBadge verified={record.verifiedByInstitution} label="Institution verified" />
                  </div>
                  {record.highlights.length > 0 && (
                    <ul className="mt-3 flex flex-wrap gap-1.5">
                      {record.highlights.map((highlight) => (
                        <li key={highlight}><Badge variant="muted">{highlight}</Badge></li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            )}
          />
        )}
      </div>
    </div>
  );
}

function OverviewStat({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
        <p className="mt-0.5 text-xs font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

function VerifiedBadge({ verified, label = "Verified" }: { verified: boolean; label?: string }) {
  return verified ? (
    <Badge variant="success" className="gap-1">
      <ShieldCheck className="size-3" />
      {label}
    </Badge>
  ) : (
    <Badge variant="muted" className="gap-1">
      <Sparkles className="size-3" />
      Self-reported
    </Badge>
  );
}

function SectionList<T>({
  items, render, empty,
}: {
  items: T[];
  render: (item: T) => React.ReactNode;
  empty: { icon: string; title: string; description: string };
}) {
  if (items.length === 0) {
    return <EmptyState icon={empty.icon} title={empty.title} description={empty.description} />;
  }
  return <div className="space-y-3">{items.map(render)}</div>;
}
