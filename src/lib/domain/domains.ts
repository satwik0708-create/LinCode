import type { LearningDomain } from "@/lib/types";

/**
 * General learning domains a student can enrol in. A student may hold any
 * number of these at once and add more at any time — enrolment is a list,
 * never a single field.
 */
export const LEARNING_DOMAINS: LearningDomain[] = [
  {
    id: "fullstack",
    name: "Full Stack Development",
    tagline: "Ship complete products, front to back",
    description:
      "Build and deploy production web applications: interfaces, APIs, databases, authentication and delivery.",
    icon: "Code2",
    gradient: "from-indigo-500 to-violet-500",
    skillIds: [
      "html", "css", "javascript", "dom", "async-js", "react", "typescript",
      "rest-apis", "nodejs", "databases", "auth", "testing", "git",
    ],
    estimatedWeeks: 24,
    industryDemand: 92,
    averageSalaryLpa: 8.4,
    roles: ["Frontend Developer", "Backend Developer", "Full Stack Engineer", "Web Developer"],
  },
  {
    id: "ml",
    name: "Machine Learning",
    tagline: "Turn data into models that decide",
    description:
      "From the mathematics underneath to training, evaluating and deploying models that survive real traffic.",
    icon: "Brain",
    gradient: "from-emerald-500 to-teal-500",
    skillIds: [
      "python", "math-ml", "numpy-pandas", "ml-supervised", "ml-unsupervised",
      "model-eval", "feature-eng", "deep-learning", "mlops", "git",
    ],
    estimatedWeeks: 26,
    industryDemand: 88,
    averageSalaryLpa: 11.2,
    roles: ["ML Engineer", "Applied Scientist", "Data Scientist", "AI Engineer"],
  },
  {
    id: "cloud",
    name: "Cloud Computing",
    tagline: "Run systems that stay up",
    description:
      "Linux, networking, containers, orchestration and infrastructure as code — the platform everything else runs on.",
    icon: "Cloud",
    gradient: "from-sky-500 to-cyan-500",
    skillIds: [
      "linux", "networking", "cloud-core", "containers", "kubernetes",
      "iac", "cicd", "cloud-security", "observability", "git",
    ],
    estimatedWeeks: 22,
    industryDemand: 90,
    averageSalaryLpa: 9.6,
    roles: ["Cloud Engineer", "DevOps Engineer", "SRE", "Platform Engineer"],
  },
  {
    id: "data-science",
    name: "AI & Data Science",
    tagline: "Answer questions the business cannot",
    description:
      "Statistics, analytical SQL, experimentation and modern LLM systems — plus the storytelling that makes them count.",
    icon: "LineChart",
    gradient: "from-fuchsia-500 to-pink-500",
    skillIds: [
      "python", "stats", "data-wrangling", "sql-analytics", "numpy-pandas",
      "data-viz", "model-eval", "experimentation", "genai", "data-storytelling",
    ],
    estimatedWeeks: 20,
    industryDemand: 85,
    averageSalaryLpa: 10.1,
    roles: ["Data Analyst", "Data Scientist", "BI Engineer", "AI Product Analyst"],
  },
  {
    id: "cybersecurity",
    name: "Cybersecurity",
    tagline: "Break it before someone else does",
    description:
      "Threat modelling, web and network security, cryptography, incident response and the compliance layer around them.",
    icon: "ShieldCheck",
    gradient: "from-amber-500 to-orange-500",
    skillIds: [
      "sec-fundamentals", "linux", "networking", "cryptography", "web-security",
      "network-security", "secure-coding", "incident-response", "grc",
    ],
    estimatedWeeks: 22,
    industryDemand: 87,
    averageSalaryLpa: 9.9,
    roles: ["Security Analyst", "AppSec Engineer", "SOC Analyst", "Penetration Tester"],
  },
];

const byId = new Map(LEARNING_DOMAINS.map((d) => [d.id, d]));

export function getDomain(id: string): LearningDomain | undefined {
  return byId.get(id);
}

export function domainName(id: string): string {
  return byId.get(id)?.name ?? id;
}

export const DOMAIN_IDS = LEARNING_DOMAINS.map((d) => d.id);
