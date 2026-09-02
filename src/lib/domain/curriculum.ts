import type { Course, LearningModule, LearningLevel, LearningResource } from "@/lib/types";
import { LEARNING_DOMAINS } from "./domains";

/**
 * Course + module catalogue. This is *content*, not user data, so it lives in
 * code rather than in the datastore. Swapping it for a CMS or a `modules` table
 * later only requires reimplementing the accessors at the bottom of this file.
 */

type ModuleSeed = {
  id: string;
  title: string;
  summary: string;
  level: LearningLevel;
  minutes: number;
  skills: string[];
  prereqs?: string[];
  resources: Array<[LearningResource["type"], string, string, string, number]>;
};

const CURRICULA: Record<string, ModuleSeed[]> = {
  fullstack: [
    {
      id: "fs-html", title: "HTML fundamentals & semantics", level: "beginner", minutes: 180, skills: ["html"],
      summary: "Structure documents correctly, build accessible forms, and understand how the browser parses markup.",
      resources: [
        ["video", "HTML Full Course for Beginners", "freeCodeCamp", "https://www.youtube.com/watch?v=pQN-pnXPaVg", 120],
        ["docs", "HTML: HyperText Markup Language", "MDN Web Docs", "https://developer.mozilla.org/en-US/docs/Web/HTML", 45],
        ["quiz", "Semantics & forms checkpoint", "SkillBridge", "/student/assessment", 15],
      ],
    },
    {
      id: "fs-css", title: "CSS layout & responsive design", level: "beginner", minutes: 240, skills: ["css"], prereqs: ["fs-html"],
      summary: "Flexbox, grid, the cascade, and building layouts that hold up from 360px to ultrawide.",
      resources: [
        ["docs", "CSS layout guide", "MDN Web Docs", "https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout", 90],
        ["lab", "Flexbox & Grid practice labs", "SkillBridge Labs", "/student/learning", 90],
        ["article", "A Complete Guide to Flexbox", "CSS-Tricks", "https://css-tricks.com/snippets/css/a-guide-to-flexbox/", 45],
      ],
    },
    {
      id: "fs-js", title: "JavaScript fundamentals", level: "beginner", minutes: 300, skills: ["javascript"], prereqs: ["fs-html"],
      summary: "Types, scope, closures, prototypes and the mental model behind the language's rough edges.",
      resources: [
        ["docs", "JavaScript Guide", "MDN Web Docs", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide", 120],
        ["article", "You Don't Know JS Yet", "Kyle Simpson", "https://github.com/getify/You-Dont-Know-JS", 120],
        ["quiz", "JavaScript fundamentals checkpoint", "SkillBridge", "/student/assessment", 20],
      ],
    },
    {
      id: "fs-dom", title: "DOM & browser APIs", level: "beginner", minutes: 180, skills: ["dom"], prereqs: ["fs-js"],
      summary: "Events, delegation, rendering behaviour, storage and the platform APIs you actually reach for.",
      resources: [
        ["docs", "Document Object Model", "MDN Web Docs", "https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model", 60],
        ["lab", "Build an interactive dashboard without a framework", "SkillBridge Labs", "/student/learning", 120],
      ],
    },
    {
      id: "fs-async", title: "Asynchronous JavaScript", level: "intermediate", minutes: 200, skills: ["async-js"], prereqs: ["fs-js"],
      summary: "The event loop, promises, async/await, cancellation and error handling that does not swallow failures.",
      resources: [
        ["docs", "Using promises", "MDN Web Docs", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises", 60],
        ["video", "What the heck is the event loop anyway?", "JSConf", "https://www.youtube.com/watch?v=8aGhZQkoFbQ", 27],
        ["lab", "Concurrency & retry patterns lab", "SkillBridge Labs", "/student/learning", 90],
      ],
    },
    {
      id: "fs-react", title: "React fundamentals", level: "intermediate", minutes: 360, skills: ["react"], prereqs: ["fs-js", "fs-dom"],
      summary: "Components, state, effects, composition — and understanding when React re-renders and why.",
      resources: [
        ["docs", "Learn React", "React", "https://react.dev/learn", 180],
        ["lab", "Build a filterable opportunity board", "SkillBridge Labs", "/student/learning", 150],
        ["quiz", "React checkpoint", "SkillBridge", "/student/assessment", 20],
      ],
    },
    {
      id: "fs-ts", title: "TypeScript for application code", level: "intermediate", minutes: 220, skills: ["typescript"], prereqs: ["fs-js"],
      summary: "Structural typing, generics, narrowing, and typing the boundary between client and server.",
      resources: [
        ["docs", "TypeScript Handbook", "TypeScript", "https://www.typescriptlang.org/docs/handbook/intro.html", 120],
        ["lab", "Type a REST client end to end", "SkillBridge Labs", "/student/learning", 90],
      ],
    },
    {
      id: "fs-apis", title: "REST APIs & HTTP", level: "intermediate", minutes: 200, skills: ["rest-apis"], prereqs: ["fs-async"],
      summary: "Resource design, status codes, idempotency, pagination, versioning and sane error contracts.",
      resources: [
        ["docs", "HTTP overview", "MDN Web Docs", "https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview", 60],
        ["lab", "Design and document an internship API", "SkillBridge Labs", "/student/learning", 120],
      ],
    },
    {
      id: "fs-node", title: "Node.js & server fundamentals", level: "intermediate", minutes: 260, skills: ["nodejs"], prereqs: ["fs-apis"],
      summary: "Runtime model, modules, streams, the request lifecycle and where server work actually belongs.",
      resources: [
        ["docs", "Node.js Guides", "Node.js", "https://nodejs.org/en/learn", 120],
        ["lab", "Build a paginated JSON API", "SkillBridge Labs", "/student/learning", 140],
      ],
    },
    {
      id: "fs-db", title: "Databases & data modelling", level: "intermediate", minutes: 280, skills: ["databases"], prereqs: ["fs-node"],
      summary: "Relational modelling, joins, indexes, transactions and the queries that quietly cost you production.",
      resources: [
        ["article", "SQL Tutorial", "PostgreSQL", "https://www.postgresql.org/docs/current/tutorial.html", 120],
        ["lab", "Model the SkillBridge schema yourself", "SkillBridge Labs", "/student/learning", 160],
      ],
    },
    {
      id: "fs-auth", title: "Authentication & authorization", level: "advanced", minutes: 240, skills: ["auth", "secure-coding"], prereqs: ["fs-node", "fs-db"],
      summary: "Password storage, sessions vs tokens, role-based access control and the failure modes of each.",
      resources: [
        ["article", "OWASP Authentication Cheat Sheet", "OWASP", "https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html", 60],
        ["lab", "Add RBAC to a multi-tenant app", "SkillBridge Labs", "/student/learning", 150],
      ],
    },
    {
      id: "fs-testing", title: "Testing & quality", level: "advanced", minutes: 180, skills: ["testing"], prereqs: ["fs-react", "fs-node"],
      summary: "What to unit test, what to integration test, and how to keep a suite that people trust.",
      resources: [
        ["docs", "Testing Library guiding principles", "Testing Library", "https://testing-library.com/docs/guiding-principles", 30],
        ["lab", "Write the tests for your own project", "SkillBridge Labs", "/student/learning", 120],
      ],
    },
    {
      id: "fs-capstone", title: "Full-stack capstone project", level: "advanced", minutes: 720, skills: ["react", "nodejs", "databases", "auth", "git"], prereqs: ["fs-auth", "fs-testing"],
      summary: "Ship one complete, deployed, authenticated application and put it in your portfolio.",
      resources: [
        ["project", "Capstone brief & rubric", "SkillBridge", "/student/portfolio", 720],
      ],
    },
  ],

  ml: [
    {
      id: "ml-python", title: "Python for machine learning", level: "beginner", minutes: 240, skills: ["python"],
      summary: "Idiomatic Python, data structures, comprehensions and the standard library you will actually use.",
      resources: [
        ["docs", "The Python Tutorial", "Python.org", "https://docs.python.org/3/tutorial/", 120],
        ["lab", "Data structures practice set", "SkillBridge Labs", "/student/learning", 90],
      ],
    },
    {
      id: "ml-math", title: "Mathematics for ML", level: "beginner", minutes: 300, skills: ["math-ml"],
      summary: "Linear algebra, probability and the calculus that makes gradient descent make sense.",
      resources: [
        ["video", "Essence of Linear Algebra", "3Blue1Brown", "https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab", 150],
        ["article", "Mathematics for Machine Learning", "Deisenroth et al.", "https://mml-book.github.io/", 150],
      ],
    },
    {
      id: "ml-numpy", title: "NumPy & Pandas", level: "beginner", minutes: 220, skills: ["numpy-pandas"], prereqs: ["ml-python"],
      summary: "Vectorised computation, broadcasting, dataframes, joins and group-bys without loops.",
      resources: [
        ["docs", "Pandas user guide", "pandas", "https://pandas.pydata.org/docs/user_guide/index.html", 120],
        ["lab", "Clean a messy placement dataset", "SkillBridge Labs", "/student/learning", 100],
      ],
    },
    {
      id: "ml-supervised", title: "Supervised learning", level: "intermediate", minutes: 320, skills: ["ml-supervised"], prereqs: ["ml-math", "ml-numpy"],
      summary: "Linear and tree-based models, regularisation, and reading the bias-variance trade-off correctly.",
      resources: [
        ["docs", "Supervised learning", "scikit-learn", "https://scikit-learn.org/stable/supervised_learning.html", 150],
        ["lab", "Predict placement outcomes", "SkillBridge Labs", "/student/learning", 170],
      ],
    },
    {
      id: "ml-eval", title: "Model evaluation & error analysis", level: "intermediate", minutes: 200, skills: ["model-eval"], prereqs: ["ml-supervised"],
      summary: "Cross-validation, metric selection under class imbalance, and looking at what the model got wrong.",
      resources: [
        ["docs", "Model evaluation", "scikit-learn", "https://scikit-learn.org/stable/modules/model_evaluation.html", 90],
        ["lab", "Build an error-analysis notebook", "SkillBridge Labs", "/student/learning", 110],
      ],
    },
    {
      id: "ml-features", title: "Feature engineering", level: "intermediate", minutes: 220, skills: ["feature-eng"], prereqs: ["ml-numpy"],
      summary: "Encoding, scaling, target leakage, and why the pipeline boundary matters more than the model.",
      resources: [
        ["docs", "Preprocessing data", "scikit-learn", "https://scikit-learn.org/stable/modules/preprocessing.html", 90],
        ["lab", "Leakage hunt", "SkillBridge Labs", "/student/learning", 120],
      ],
    },
    {
      id: "ml-unsupervised", title: "Unsupervised learning", level: "intermediate", minutes: 180, skills: ["ml-unsupervised"], prereqs: ["ml-supervised"],
      summary: "Clustering, dimensionality reduction and knowing when there is no label to be had.",
      resources: [
        ["docs", "Clustering", "scikit-learn", "https://scikit-learn.org/stable/modules/clustering.html", 80],
        ["lab", "Segment learners by skill profile", "SkillBridge Labs", "/student/learning", 100],
      ],
    },
    {
      id: "ml-deep", title: "Deep learning", level: "advanced", minutes: 420, skills: ["deep-learning"], prereqs: ["ml-eval", "ml-features"],
      summary: "Neural networks from backpropagation to CNNs and transformers, trained on hardware you have.",
      resources: [
        ["video", "Neural Networks: Zero to Hero", "Andrej Karpathy", "https://www.youtube.com/playlist?list=PLAqhIrjkxbuWI23v9cThsA9GvCAUhRvKZ", 240],
        ["docs", "PyTorch tutorials", "PyTorch", "https://pytorch.org/tutorials/", 180],
      ],
    },
    {
      id: "ml-mlops", title: "MLOps & deployment", level: "advanced", minutes: 260, skills: ["mlops"], prereqs: ["ml-deep"],
      summary: "Packaging, serving, monitoring, drift detection and reproducibility once a model leaves the notebook.",
      resources: [
        ["article", "Rules of Machine Learning", "Google", "https://developers.google.com/machine-learning/guides/rules-of-ml", 90],
        ["lab", "Serve a model behind an API", "SkillBridge Labs", "/student/learning", 170],
      ],
    },
    {
      id: "ml-capstone", title: "ML capstone project", level: "advanced", minutes: 600, skills: ["ml-supervised", "model-eval", "mlops", "git"], prereqs: ["ml-mlops"],
      summary: "End-to-end: problem framing, data, model, evaluation, deployment and a written result.",
      resources: [["project", "Capstone brief & rubric", "SkillBridge", "/student/portfolio", 600]],
    },
  ],

  cloud: [
    {
      id: "cl-linux", title: "Linux & the shell", level: "beginner", minutes: 220, skills: ["linux"],
      summary: "Filesystem, processes, permissions, package management and scripting that saves you hours.",
      resources: [
        ["article", "The Linux Command Line", "William Shotts", "https://linuxcommand.org/tlcl.php", 120],
        ["lab", "Shell scripting drills", "SkillBridge Labs", "/student/learning", 100],
      ],
    },
    {
      id: "cl-net", title: "Networking fundamentals", level: "beginner", minutes: 240, skills: ["networking"],
      summary: "TCP/IP, DNS, HTTP, TLS, routing and load balancing — the layer every outage starts at.",
      resources: [
        ["docs", "How the web works", "MDN Web Docs", "https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web/How_the_Web_works", 45],
        ["lab", "Trace a request end to end", "SkillBridge Labs", "/student/learning", 120],
      ],
    },
    {
      id: "cl-core", title: "Cloud core services", level: "beginner", minutes: 260, skills: ["cloud-core"], prereqs: ["cl-net"],
      summary: "Compute, storage, identity, queues and managed databases — and what each actually costs.",
      resources: [
        ["docs", "AWS Cloud Practitioner Essentials", "AWS Skill Builder", "https://aws.amazon.com/training/digital/aws-cloud-practitioner-essentials/", 180],
        ["lab", "Deploy a static site plus API", "SkillBridge Labs", "/student/learning", 90],
      ],
    },
    {
      id: "cl-containers", title: "Containers & Docker", level: "intermediate", minutes: 220, skills: ["containers"], prereqs: ["cl-linux"],
      summary: "Images, layers, registries, networking and writing Dockerfiles that build in seconds not minutes.",
      resources: [
        ["docs", "Docker get started", "Docker", "https://docs.docker.com/get-started/", 100],
        ["lab", "Containerise a full-stack app", "SkillBridge Labs", "/student/learning", 120],
      ],
    },
    {
      id: "cl-k8s", title: "Kubernetes", level: "intermediate", minutes: 340, skills: ["kubernetes"], prereqs: ["cl-containers"],
      summary: "Pods, deployments, services, config, probes and debugging a cluster that will not schedule.",
      resources: [
        ["docs", "Kubernetes Basics", "Kubernetes", "https://kubernetes.io/docs/tutorials/kubernetes-basics/", 150],
        ["lab", "Ship a rolling deployment", "SkillBridge Labs", "/student/learning", 180],
      ],
    },
    {
      id: "cl-iac", title: "Infrastructure as code", level: "intermediate", minutes: 240, skills: ["iac"], prereqs: ["cl-core"],
      summary: "Declarative provisioning, state files, modules and environments you can rebuild from scratch.",
      resources: [
        ["docs", "Terraform tutorials", "HashiCorp", "https://developer.hashicorp.com/terraform/tutorials", 140],
        ["lab", "Codify a three-tier environment", "SkillBridge Labs", "/student/learning", 100],
      ],
    },
    {
      id: "cl-cicd", title: "CI/CD pipelines", level: "intermediate", minutes: 200, skills: ["cicd"], prereqs: ["cl-containers"],
      summary: "Build, test, artefact, promote — and rolling back before your users notice.",
      resources: [
        ["docs", "GitHub Actions", "GitHub", "https://docs.github.com/en/actions", 100],
        ["lab", "Pipeline with environment gates", "SkillBridge Labs", "/student/learning", 100],
      ],
    },
    {
      id: "cl-security", title: "Cloud security & IAM", level: "advanced", minutes: 220, skills: ["cloud-security"], prereqs: ["cl-iac"],
      summary: "Least privilege, secret management, network isolation and finding the door you left open.",
      resources: [
        ["article", "AWS Well-Architected: Security Pillar", "AWS", "https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/welcome.html", 120],
        ["lab", "Audit an over-permissive account", "SkillBridge Labs", "/student/learning", 100],
      ],
    },
    {
      id: "cl-observability", title: "Observability & reliability", level: "advanced", minutes: 200, skills: ["observability"], prereqs: ["cl-k8s"],
      summary: "Logs, metrics, traces, SLOs and alerts that wake someone only when it matters.",
      resources: [
        ["article", "Google SRE Book", "Google", "https://sre.google/sre-book/table-of-contents/", 120],
        ["lab", "Instrument a service end to end", "SkillBridge Labs", "/student/learning", 80],
      ],
    },
    {
      id: "cl-capstone", title: "Cloud capstone project", level: "advanced", minutes: 540, skills: ["kubernetes", "iac", "cicd", "cloud-security"], prereqs: ["cl-security", "cl-observability"],
      summary: "Provision, deploy, monitor and document a production-shaped environment from empty account to running service.",
      resources: [["project", "Capstone brief & rubric", "SkillBridge", "/student/portfolio", 540]],
    },
  ],

  "data-science": [
    {
      id: "ds-python", title: "Python for analysis", level: "beginner", minutes: 220, skills: ["python"],
      summary: "The subset of Python that analytical work actually runs on, plus notebook hygiene.",
      resources: [
        ["docs", "The Python Tutorial", "Python.org", "https://docs.python.org/3/tutorial/", 110],
        ["lab", "Notebook fundamentals", "SkillBridge Labs", "/student/learning", 90],
      ],
    },
    {
      id: "ds-stats", title: "Statistics that matter", level: "beginner", minutes: 280, skills: ["stats"],
      summary: "Distributions, sampling, confidence intervals, hypothesis tests and how each is misread.",
      resources: [
        ["video", "Statistics Fundamentals", "StatQuest", "https://www.youtube.com/playlist?list=PLblh5JKOoLUK0FLuzwntyYI10UQFUhsY9", 150],
        ["lab", "Inference practice set", "SkillBridge Labs", "/student/learning", 120],
      ],
    },
    {
      id: "ds-sql", title: "Analytical SQL", level: "beginner", minutes: 240, skills: ["sql-analytics"],
      summary: "CTEs, window functions, cohorting and writing queries a reviewer can follow.",
      resources: [
        ["docs", "PostgreSQL window functions", "PostgreSQL", "https://www.postgresql.org/docs/current/tutorial-window.html", 90],
        ["lab", "Cohort analysis on placement data", "SkillBridge Labs", "/student/learning", 140],
      ],
    },
    {
      id: "ds-wrangle", title: "Data wrangling", level: "intermediate", minutes: 220, skills: ["data-wrangling", "numpy-pandas"], prereqs: ["ds-python"],
      summary: "Cleaning, joining, reshaping and validating data that arrives worse than you were promised.",
      resources: [
        ["docs", "Pandas user guide", "pandas", "https://pandas.pydata.org/docs/user_guide/index.html", 110],
        ["lab", "Repair a broken dataset", "SkillBridge Labs", "/student/learning", 110],
      ],
    },
    {
      id: "ds-viz", title: "Visualisation & communication", level: "intermediate", minutes: 180, skills: ["data-viz", "data-storytelling"], prereqs: ["ds-wrangle"],
      summary: "Choosing encodings, avoiding chart junk, and making the conclusion impossible to miss.",
      resources: [
        ["article", "Fundamentals of Data Visualization", "Claus Wilke", "https://clauswilke.com/dataviz/", 120],
        ["lab", "Rebuild a bad dashboard", "SkillBridge Labs", "/student/learning", 60],
      ],
    },
    {
      id: "ds-experiments", title: "Experimentation & A/B testing", level: "intermediate", minutes: 200, skills: ["experimentation", "model-eval"], prereqs: ["ds-stats"],
      summary: "Design, power analysis, guardrail metrics and resisting the urge to peek.",
      resources: [
        ["article", "Trustworthy Online Controlled Experiments", "Kohavi et al.", "https://experimentguide.com/", 120],
        ["lab", "Design an experiment end to end", "SkillBridge Labs", "/student/learning", 80],
      ],
    },
    {
      id: "ds-genai", title: "Generative AI & LLM systems", level: "advanced", minutes: 300, skills: ["genai"], prereqs: ["ds-viz"],
      summary: "Prompting, embeddings, retrieval-augmented generation and evaluating systems that are not deterministic.",
      resources: [
        ["docs", "Building with Claude", "Anthropic", "https://docs.anthropic.com/en/docs/overview", 120],
        ["lab", "Build and evaluate a RAG pipeline", "SkillBridge Labs", "/student/learning", 180],
      ],
    },
    {
      id: "ds-capstone", title: "Data science capstone", level: "advanced", minutes: 540, skills: ["stats", "sql-analytics", "data-viz", "data-storytelling"], prereqs: ["ds-experiments", "ds-genai"],
      summary: "Take a real question from raw data to a decision memo somebody could act on.",
      resources: [["project", "Capstone brief & rubric", "SkillBridge", "/student/portfolio", 540]],
    },
  ],

  cybersecurity: [
    {
      id: "cy-fundamentals", title: "Security fundamentals", level: "beginner", minutes: 200, skills: ["sec-fundamentals"],
      summary: "CIA triad, threat modelling, attack surface and thinking like the person on the other side.",
      resources: [
        ["article", "Threat Modeling Cheat Sheet", "OWASP", "https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html", 60],
        ["lab", "Threat-model a real application", "SkillBridge Labs", "/student/learning", 120],
      ],
    },
    {
      id: "cy-linux", title: "Linux & networking for security", level: "beginner", minutes: 240, skills: ["linux", "networking"],
      summary: "The systems knowledge every other security skill sits on top of.",
      resources: [
        ["article", "The Linux Command Line", "William Shotts", "https://linuxcommand.org/tlcl.php", 120],
        ["lab", "Packet capture and analysis", "SkillBridge Labs", "/student/learning", 110],
      ],
    },
    {
      id: "cy-crypto", title: "Applied cryptography", level: "intermediate", minutes: 220, skills: ["cryptography"], prereqs: ["cy-fundamentals"],
      summary: "Hashing, symmetric and asymmetric crypto, TLS, and never rolling your own.",
      resources: [
        ["article", "Cryptographic Storage Cheat Sheet", "OWASP", "https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html", 60],
        ["lab", "Break weak crypto implementations", "SkillBridge Labs", "/student/learning", 150],
      ],
    },
    {
      id: "cy-web", title: "Web application security", level: "intermediate", minutes: 320, skills: ["web-security"], prereqs: ["cy-fundamentals"],
      summary: "OWASP Top 10 in depth: injection, XSS, CSRF, access-control failures and their real mitigations.",
      resources: [
        ["docs", "OWASP Top 10", "OWASP", "https://owasp.org/www-project-top-ten/", 90],
        ["lab", "Exploit and then patch a vulnerable app", "SkillBridge Labs", "/student/learning", 210],
      ],
    },
    {
      id: "cy-network", title: "Network security", level: "intermediate", minutes: 240, skills: ["network-security"], prereqs: ["cy-linux"],
      summary: "Segmentation, firewalls, TLS termination, and reading traffic for what should not be there.",
      resources: [
        ["docs", "Wireshark User's Guide", "Wireshark", "https://www.wireshark.org/docs/wsug_html_chunked/", 100],
        ["lab", "Detect lateral movement", "SkillBridge Labs", "/student/learning", 140],
      ],
    },
    {
      id: "cy-secure-coding", title: "Secure coding", level: "advanced", minutes: 240, skills: ["secure-coding", "auth"], prereqs: ["cy-web"],
      summary: "Validation, safe defaults, authorisation checks on the server, and dependency hygiene.",
      resources: [
        ["article", "OWASP Proactive Controls", "OWASP", "https://owasp.org/www-project-proactive-controls/", 90],
        ["lab", "Security-review a real pull request", "SkillBridge Labs", "/student/learning", 150],
      ],
    },
    {
      id: "cy-ir", title: "Incident response", level: "advanced", minutes: 220, skills: ["incident-response"], prereqs: ["cy-network"],
      summary: "Detect, contain, eradicate, recover — and write the postmortem that stops the repeat.",
      resources: [
        ["docs", "NIST SP 800-61 Incident Handling Guide", "NIST", "https://csrc.nist.gov/pubs/sp/800/61/r2/final", 120],
        ["lab", "Run a tabletop exercise", "SkillBridge Labs", "/student/learning", 100],
      ],
    },
    {
      id: "cy-grc", title: "Governance, risk & compliance", level: "advanced", minutes: 180, skills: ["grc"], prereqs: ["cy-ir"],
      summary: "Risk registers, control frameworks, audits and translating security into business language.",
      resources: [
        ["docs", "NIST Cybersecurity Framework", "NIST", "https://www.nist.gov/cyberframework", 100],
        ["lab", "Build a risk register", "SkillBridge Labs", "/student/learning", 80],
      ],
    },
    {
      id: "cy-capstone", title: "Security capstone", level: "advanced", minutes: 480, skills: ["web-security", "secure-coding", "incident-response"], prereqs: ["cy-secure-coding", "cy-grc"],
      summary: "Assess an application end to end and deliver a findings report with remediation.",
      resources: [["project", "Capstone brief & rubric", "SkillBridge", "/student/portfolio", 480]],
    },
  ],
};

/* ------------------------------------------------------------------ */

function buildModules(): LearningModule[] {
  const out: LearningModule[] = [];
  for (const domain of LEARNING_DOMAINS) {
    const seeds = CURRICULA[domain.id] ?? [];
    seeds.forEach((seed, index) => {
      out.push({
        id: seed.id,
        domainId: domain.id,
        courseId: `${domain.id}-${seed.level}`,
        title: seed.title,
        summary: seed.summary,
        level: seed.level,
        order: index,
        estimatedMinutes: seed.minutes,
        skillIds: seed.skills,
        prerequisiteModuleIds: seed.prereqs ?? [],
        resources: seed.resources.map(([type, title, provider, url, minutes], i) => ({
          id: `${seed.id}-r${i}`,
          title,
          type,
          provider,
          url,
          minutes,
        })),
      });
    });
  }
  return out;
}

export const MODULES: LearningModule[] = buildModules();

export const COURSES: Course[] = LEARNING_DOMAINS.flatMap((domain) =>
  (["beginner", "intermediate", "advanced"] as LearningLevel[]).map((level) => {
    const modules = MODULES.filter((m) => m.domainId === domain.id && m.level === level);
    return {
      id: `${domain.id}-${level}`,
      domainId: domain.id,
      title: `${domain.name} — ${level[0].toUpperCase()}${level.slice(1)}`,
      level,
      summary: `${modules.length} modules covering the ${level} track of ${domain.name}.`,
      moduleIds: modules.map((m) => m.id),
    };
  }),
);

const moduleById = new Map(MODULES.map((m) => [m.id, m]));

export function getModule(id: string): LearningModule | undefined {
  return moduleById.get(id);
}

export function modulesForDomain(domainId: string): LearningModule[] {
  return MODULES.filter((m) => m.domainId === domainId).sort((a, b) => a.order - b.order);
}

export function coursesForDomain(domainId: string): Course[] {
  return COURSES.filter((c) => c.domainId === domainId);
}
