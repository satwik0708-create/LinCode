import type { Skill } from "@/lib/types";

/**
 * The skill taxonomy. Every assessment question, module, job requirement and
 * portfolio entry references skills by id, so a skill is defined exactly once.
 */
const raw: Array<[string, string, Skill["category"], string[], string]> = [
  // --- Full Stack Development -------------------------------------------
  ["html", "HTML & Semantics", "technical", ["fullstack"], "Document structure, accessibility semantics and forms."],
  ["css", "CSS & Responsive Design", "technical", ["fullstack"], "Layout with flexbox/grid, responsive breakpoints, design systems."],
  ["javascript", "JavaScript", "technical", ["fullstack"], "Language fundamentals, scope, closures, prototypes."],
  ["dom", "DOM & Browser APIs", "technical", ["fullstack"], "Events, rendering, storage and browser platform APIs."],
  ["async-js", "Asynchronous JavaScript", "technical", ["fullstack"], "Promises, async/await, concurrency and error handling."],
  ["react", "React", "technical", ["fullstack"], "Components, state, hooks, composition and rendering behaviour."],
  ["typescript", "TypeScript", "technical", ["fullstack"], "Static typing, generics and type-safe API contracts."],
  ["rest-apis", "REST APIs", "technical", ["fullstack"], "HTTP semantics, resource design, status codes and versioning."],
  ["nodejs", "Node.js", "technical", ["fullstack"], "Server runtime, modules, streams and the request lifecycle."],
  ["databases", "Databases & SQL", "technical", ["fullstack", "data-science"], "Schema design, joins, indexing and transactions."],
  ["auth", "Authentication & Sessions", "technical", ["fullstack", "cybersecurity"], "Sessions, tokens, password storage and access control."],
  ["testing", "Testing & Quality", "technical", ["fullstack"], "Unit, integration and end-to-end testing strategy."],
  ["git", "Git & Collaboration", "tool", ["fullstack", "ml", "cloud", "data-science", "cybersecurity"], "Branching, reviews and collaborative workflows."],

  // --- Machine Learning ---------------------------------------------------
  ["python", "Python", "technical", ["ml", "data-science", "cybersecurity"], "Idiomatic Python, data structures and standard library."],
  ["math-ml", "Math for ML", "technical", ["ml"], "Linear algebra, probability and calculus foundations."],
  ["numpy-pandas", "NumPy & Pandas", "tool", ["ml", "data-science"], "Vectorised computation and dataframe manipulation."],
  ["ml-supervised", "Supervised Learning", "technical", ["ml"], "Regression, classification, bias-variance and regularisation."],
  ["ml-unsupervised", "Unsupervised Learning", "technical", ["ml"], "Clustering, dimensionality reduction and density estimation."],
  ["model-eval", "Model Evaluation", "technical", ["ml", "data-science"], "Cross-validation, metrics selection and error analysis."],
  ["feature-eng", "Feature Engineering", "technical", ["ml", "data-science"], "Encoding, scaling, leakage avoidance and selection."],
  ["deep-learning", "Deep Learning", "technical", ["ml"], "Neural networks, backpropagation, CNNs and transformers."],
  ["mlops", "MLOps & Deployment", "technical", ["ml", "cloud"], "Serving, monitoring, drift detection and reproducibility."],

  // --- Cloud Computing ----------------------------------------------------
  ["linux", "Linux & Shell", "tool", ["cloud", "cybersecurity"], "Filesystem, processes, permissions and shell scripting."],
  ["networking", "Networking Fundamentals", "technical", ["cloud", "cybersecurity"], "TCP/IP, DNS, HTTP, routing and load balancing."],
  ["cloud-core", "Cloud Core Services", "technical", ["cloud"], "Compute, storage, identity and managed services."],
  ["containers", "Containers & Docker", "tool", ["cloud"], "Images, layers, registries and container runtime behaviour."],
  ["kubernetes", "Kubernetes", "tool", ["cloud"], "Pods, deployments, services and cluster operations."],
  ["iac", "Infrastructure as Code", "tool", ["cloud"], "Declarative provisioning, state and reproducible environments."],
  ["cicd", "CI/CD", "technical", ["cloud", "fullstack"], "Pipelines, artefacts, environments and safe releases."],
  ["cloud-security", "Cloud Security", "technical", ["cloud", "cybersecurity"], "IAM, least privilege, secrets and network isolation."],
  ["observability", "Observability", "technical", ["cloud"], "Logs, metrics, traces and alerting."],

  // --- AI & Data Science --------------------------------------------------
  ["stats", "Statistics", "technical", ["data-science"], "Distributions, inference, hypothesis testing and estimation."],
  ["data-wrangling", "Data Wrangling", "technical", ["data-science"], "Cleaning, joining, reshaping and validating messy data."],
  ["data-viz", "Data Visualisation", "technical", ["data-science"], "Encoding choice, chart design and honest presentation."],
  ["sql-analytics", "Analytical SQL", "technical", ["data-science"], "Window functions, CTEs and analytical query patterns."],
  ["experimentation", "Experimentation & A/B Testing", "technical", ["data-science"], "Design, power, and reading results correctly."],
  ["genai", "Generative AI & LLMs", "technical", ["data-science", "ml"], "Prompting, embeddings, RAG and evaluation of LLM systems."],
  ["data-storytelling", "Data Storytelling", "soft", ["data-science"], "Turning analysis into decisions stakeholders act on."],

  // --- Cybersecurity ------------------------------------------------------
  ["sec-fundamentals", "Security Fundamentals", "technical", ["cybersecurity"], "CIA triad, threat modelling and defence in depth."],
  ["cryptography", "Applied Cryptography", "technical", ["cybersecurity"], "Hashing, symmetric/asymmetric crypto and key handling."],
  ["web-security", "Web Application Security", "technical", ["cybersecurity", "fullstack"], "OWASP Top 10, injection, XSS, CSRF and mitigations."],
  ["network-security", "Network Security", "technical", ["cybersecurity"], "Firewalls, segmentation, TLS and traffic analysis."],
  ["incident-response", "Incident Response", "technical", ["cybersecurity"], "Detection, containment, eradication and recovery."],
  ["secure-coding", "Secure Coding", "technical", ["cybersecurity", "fullstack"], "Input validation, safe defaults and dependency hygiene."],
  ["grc", "Governance, Risk & Compliance", "domain", ["cybersecurity"], "Policy, audit, risk registers and regulatory frameworks."],

  // --- Soft skills (shared across every domain) ---------------------------
  ["communication", "Communication", "soft", ["fullstack", "ml", "cloud", "data-science", "cybersecurity"], "Written and verbal clarity with technical and non-technical audiences."],
  ["teamwork", "Teamwork & Collaboration", "soft", ["fullstack", "ml", "cloud", "data-science", "cybersecurity"], "Working effectively across roles and handling feedback."],
  ["problem-solving", "Problem Solving", "soft", ["fullstack", "ml", "cloud", "data-science", "cybersecurity"], "Structured decomposition and reasoning under ambiguity."],
  ["ownership", "Ownership & Initiative", "soft", ["fullstack", "ml", "cloud", "data-science", "cybersecurity"], "Driving work to completion without being managed."],
  ["adaptability", "Adaptability", "soft", ["fullstack", "ml", "cloud", "data-science", "cybersecurity"], "Learning new tools and adjusting to changing requirements."],
];

export const SKILLS: Skill[] = raw.map(([id, name, category, domainIds, description]) => ({
  id,
  name,
  category,
  domainIds,
  description,
}));

const skillById = new Map(SKILLS.map((s) => [s.id, s]));

export function getSkill(id: string): Skill | undefined {
  return skillById.get(id);
}

export function skillName(id: string): string {
  return skillById.get(id)?.name ?? id;
}

export function skillsForDomain(domainId: string): Skill[] {
  return SKILLS.filter((s) => s.domainIds.includes(domainId));
}

export const SOFT_SKILL_IDS = SKILLS.filter((s) => s.category === "soft").map((s) => s.id);
