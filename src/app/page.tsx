import Link from "next/link";
import {
  ArrowRight, Brain, Briefcase, Building2, ClipboardCheck, Cloud, Code2,
  GraduationCap, LineChart, Route, ShieldCheck, Sparkles, Target, Users,
} from "lucide-react";
import { HeroSection, LogoMark } from "@/components/ui/hero-section-1";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LEARNING_DOMAINS } from "@/lib/domain/domains";

const DOMAIN_ICONS = { Code2, Brain, Cloud, LineChart, ShieldCheck } as const;

const LIFECYCLE = [
  { icon: ClipboardCheck, title: "Skill assessment", body: "A domain-specific diagnostic that tests what you actually know — not what you claim." },
  { icon: Target, title: "Skill gap identification", body: "Your competency map against live industry requirements, skill by skill." },
  { icon: Route, title: "Personalised learning", body: "A path that skips what you've proven and sequences what you haven't." },
  { icon: Sparkles, title: "Skill development", body: "Modules, labs and industry training programmes, with progress tracked per domain." },
  { icon: Briefcase, title: "Internships & placement", body: "Opportunities ranked by real skill compatibility, applied to and tracked in one place." },
  { icon: GraduationCap, title: "Verified digital portfolio", body: "Skills, certifications, projects and records that an employer can trust." },
];

const AUDIENCES = [
  {
    id: "students", icon: GraduationCap, title: "Students",
    points: ["Adaptive placement tests per domain", "AI skill-gap analysis and learning paths", "Skill-matched internships and jobs", "Application tracking end to end", "A verified portfolio employers can read"],
  },
  {
    id: "academia", icon: Users, title: "Faculty & academicians",
    points: ["Faculty internships and industrial training", "Faculty Development Programmes", "Consultancy and collaborative research", "Guest lectures and innovation challenges", "Mentorship of live industry projects"],
  },
  {
    id: "industry", icon: Briefcase, title: "Industry & recruiters",
    points: ["Post internships, jobs, projects and apprenticeships", "Define the exact skills a role requires", "Discover candidates by skill compatibility", "Publish training and certification programmes", "Manage the full recruitment pipeline"],
  },
  {
    id: "institutions", icon: Building2, title: "Institutions",
    points: ["Cohort skill development at a glance", "Department-level gap analysis", "Internship participation tracking", "Placement readiness and outcomes", "Industry demand and skill trends"],
  },
];

export default function LandingPage() {
  return (
    <div id="main">
      <HeroSection />

      {/* Lifecycle */}
      <section id="how-it-works" className="border-t bg-muted/30 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary" className="mb-4">The complete lifecycle</Badge>
            <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              Every step from &ldquo;what am I missing?&rdquo; to &ldquo;I&rsquo;m placement ready&rdquo;
            </h2>
            <p className="mt-4 text-balance text-muted-foreground">
              Most platforms hand you a course catalogue. LinCode works out what you already know first, and everything downstream follows from that.
            </p>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {LIFECYCLE.map((step, index) => (
              <Card key={step.title} className="group relative overflow-hidden transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <step.icon className="size-5" />
                    </span>
                    <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <CardTitle className="mt-3 text-lg">{step.title}</CardTitle>
                  <CardDescription>{step.body}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Domains */}
      <section id="students" className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <Badge variant="secondary" className="mb-4">Learning domains</Badge>
              <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                Pick one domain. Or four. Progress is tracked separately for each.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Finishing AI &amp; Data Science doesn&rsquo;t close the door on Cloud Computing — your other domains stay exactly where you left them, and you can add more at any time.
              </p>
            </div>
            <Button asChild size="lg" className="shrink-0">
              <Link href="/signup">
                Start your assessment
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {LEARNING_DOMAINS.map((domain) => {
              const Icon = DOMAIN_ICONS[domain.icon as keyof typeof DOMAIN_ICONS] ?? Code2;
              return (
                <Card key={domain.id} className="group flex flex-col overflow-hidden transition-shadow hover:shadow-md">
                  <div className={`h-1.5 w-full bg-gradient-to-r ${domain.gradient}`} />
                  <CardHeader className="flex-1">
                    <span className={`flex size-11 items-center justify-center rounded-xl bg-gradient-to-br ${domain.gradient} text-white shadow-sm`}>
                      <Icon className="size-5" />
                    </span>
                    <CardTitle className="mt-3 text-lg">{domain.name}</CardTitle>
                    <CardDescription>{domain.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-1.5">
                      {domain.roles.slice(0, 3).map((role) => (
                        <Badge key={role} variant="muted">{role}</Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
                      <span>~{domain.estimatedWeeks} weeks</span>
                      <span>Demand index {domain.industryDemand}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section id="industry" className="border-t bg-muted/30 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary" className="mb-4">Role-based by design</Badge>
            <h2 id="institutions" className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              Four audiences, four applications, one platform
            </h2>
            <p className="mt-4 text-balance text-muted-foreground">
              You see your own workspace and nothing else. Access is enforced on the server, not by hiding buttons — a student cannot reach recruiter or institutional data by typing a URL.
            </p>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {AUDIENCES.map((audience) => (
              <Card key={audience.id} className="flex flex-col">
                <CardHeader>
                  <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <audience.icon className="size-5" />
                  </span>
                  <CardTitle className="mt-3 text-lg">{audience.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-2.5 text-sm text-muted-foreground">
                    {audience.points.map((point) => (
                      <li key={point} className="flex gap-2.5">
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-6 text-center lg:px-8">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Find out what you&rsquo;re actually missing
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-balance text-muted-foreground">
            The assessment takes about ten minutes per domain. What comes out the other side is a skill profile, a gap analysis and a learning path built around it.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 rounded-xl px-7 text-base">
              <Link href="/signup">
                Get started
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 rounded-xl px-7 text-base">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div className="flex items-center gap-2">
            <LogoMark />
            <span className="text-sm font-semibold">LinCode</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Skill development, internships and placements — built for Smart India Hackathon.
          </p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <Link href="/login" className="transition-colors hover:text-foreground">Sign in</Link>
            <Link href="/signup" className="transition-colors hover:text-foreground">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
