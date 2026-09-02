import type { AssessmentQuestion, ClientQuestion, LearningLevel } from "@/lib/types";

/**
 * Domain-specific diagnostic question banks.
 *
 * Every domain has its own bank keyed to its own competency map, so a student
 * who picks "Cybersecurity — advanced" is never shown Machine Learning items.
 * `correctIndex` and `explanation` are server-only: `toClientQuestion` strips
 * them before anything is sent to a browser.
 */

type Q = [skillId: string, level: LearningLevel, prompt: string, options: string[], correct: number, explanation: string];

const BANKS: Record<string, Q[]> = {
  fullstack: [
    ["html", "beginner", "Which element correctly associates a caption with a form control for screen readers?",
      ["<span> next to the input", "<label for=\"id\">", "<div class=\"label\">", "The placeholder attribute"], 1,
      "A <label> with a matching `for` attribute is what assistive technology uses to announce the control."],
    ["css", "beginner", "A three-column card grid must collapse to one column below 640px. Which is the cleanest approach?",
      ["Absolute positioning with calculated offsets", "A media query changing grid-template-columns", "Floats plus clearfix", "Fixed pixel widths on each card"], 1,
      "Grid template columns swapped inside a media query is the idiomatic responsive pattern."],
    ["javascript", "beginner", "What does `typeof null` evaluate to in JavaScript?",
      ["\"null\"", "\"undefined\"", "\"object\"", "\"boolean\""], 2,
      "A long-standing language quirk: `typeof null` returns \"object\"."],
    ["javascript", "intermediate", "Why does a `var` counter inside a `for` loop leak the final value into every callback?",
      ["`var` is function-scoped, so all callbacks close over one binding", "`var` is immutable", "Callbacks run before the loop", "`var` copies its value per iteration"], 0,
      "`var` is function-scoped; `let` creates a fresh binding per iteration, which is why `let` fixes it."],
    ["dom", "intermediate", "Which approach handles clicks on list items that are added dynamically after page load?",
      ["Attach a listener to each item on load", "Event delegation on the parent container", "Poll the DOM every second", "Use inline onclick attributes"], 1,
      "Delegation listens on a stable ancestor, so items added later are still covered."],
    ["async-js", "intermediate", "You must run three independent API calls and fail only if all three fail. Which is correct?",
      ["await each sequentially", "Promise.all", "Promise.any", "Promise.race"], 2,
      "`Promise.any` resolves on the first success and rejects only when every promise rejects."],
    ["react", "intermediate", "A child re-renders on every parent render despite identical props. The most likely cause is:",
      ["Missing key prop", "A new object/function literal passed as a prop each render", "useEffect without dependencies", "State stored in context"], 1,
      "Fresh object/function identities defeat memoisation; stabilise them with useMemo/useCallback."],
    ["react", "advanced", "What does the dependency array of `useEffect` actually control?",
      ["The order effects run in", "Whether the effect re-runs after a render", "Whether the component re-renders", "Which props are passed down"], 1,
      "React compares dependencies between renders and re-runs the effect only when one changed."],
    ["typescript", "intermediate", "Which construct guarantees a switch handles every member of a union at compile time?",
      ["A default case returning null", "Assigning the value to `never` in the default branch", "Casting with `as any`", "Marking the union readonly"], 1,
      "Assigning to `never` in the default branch makes the compiler error when a new variant is added."],
    ["rest-apis", "intermediate", "A client retries a POST after a timeout and creates a duplicate record. The right fix is:",
      ["Return 200 instead of 201", "Accept an idempotency key and de-duplicate server-side", "Increase the client timeout", "Switch the endpoint to GET"], 1,
      "Idempotency keys let the server recognise a retry of the same logical request."],
    ["nodejs", "advanced", "Why should a CPU-heavy loop not run directly inside a Node request handler?",
      ["Node cannot do maths", "It blocks the single event loop thread, stalling every other request", "Handlers have a 1s hard limit", "It bypasses middleware"], 1,
      "Node's event loop is single-threaded; blocking it delays every pending request."],
    ["databases", "intermediate", "Queries filtering on `status` and sorting by `created_at` are slow. Best first step?",
      ["Add a composite index on (status, created_at)", "SELECT * instead of named columns", "Increase connection pool size", "Add a second database"], 0,
      "A composite index matching the filter-then-sort shape lets the planner skip the sort entirely."],
    ["auth", "advanced", "Which storage is safest for a session token in a browser app?",
      ["localStorage", "An httpOnly, Secure, SameSite cookie", "sessionStorage", "A global JS variable"], 1,
      "httpOnly cookies are unreadable to JavaScript, which removes the XSS token-theft path."],
    ["auth", "advanced", "Why must password reset return the same response for known and unknown addresses?",
      ["It is faster", "To prevent account enumeration", "To satisfy the HTTP spec", "So the mail server does not rate limit"], 1,
      "Differing responses let an attacker confirm which addresses hold accounts."],
    ["testing", "advanced", "A test suite is green but production keeps breaking at API boundaries. Most useful addition?",
      ["More snapshot tests", "Integration tests exercising the real request/response contract", "Longer timeouts", "Removing flaky tests"], 1,
      "Boundary bugs need tests that cross the boundary rather than mock it away."],
  ],

  ml: [
    ["python", "beginner", "Which structure gives average O(1) membership checks for a large collection of ids?",
      ["list", "set", "tuple", "generator"], 1,
      "Sets are hash-based, so `in` is roughly constant time."],
    ["numpy-pandas", "beginner", "The idiomatic way to add a column derived from two existing pandas columns is:",
      ["Iterate rows with iterrows()", "A vectorised expression on the columns", "A while loop over indices", "Convert to a Python list first"], 1,
      "Vectorised operations run in compiled code and are orders of magnitude faster than row loops."],
    ["math-ml", "beginner", "In gradient descent, what does the gradient tell you?",
      ["The loss value", "The direction of steepest increase of the loss", "The learning rate", "The number of iterations left"], 1,
      "You step against the gradient because it points uphill on the loss surface."],
    ["ml-supervised", "intermediate", "Training accuracy is 99%, validation accuracy 62%. This indicates:",
      ["Underfitting", "Overfitting", "Data leakage into validation", "A too-small learning rate"], 1,
      "A large train/validation gap is the classic overfitting signature."],
    ["ml-supervised", "intermediate", "Which change most directly reduces variance in a decision tree?",
      ["Increase max depth", "Limit depth / increase min samples per leaf", "Remove regularisation", "Train on more features"], 1,
      "Constraining tree growth is the standard variance-reduction lever."],
    ["model-eval", "intermediate", "For a fraud dataset that is 99.5% negative, accuracy is a poor metric because:",
      ["It is hard to compute", "Predicting the majority class always scores 99.5%", "It requires probabilities", "It only works for regression"], 1,
      "Under heavy imbalance, accuracy rewards a model that never predicts the positive class."],
    ["model-eval", "advanced", "Why is a single train/test split weaker than k-fold cross-validation on small data?",
      ["It is slower", "The estimate has high variance and depends on which rows landed in test", "It cannot use scikit-learn", "It overestimates training time"], 1,
      "k-fold averages over multiple splits, which stabilises the estimate."],
    ["feature-eng", "intermediate", "You fit the scaler on the full dataset before splitting. What went wrong?",
      ["Nothing", "Test statistics leaked into training — fit on train only", "Scaling is never needed", "The model will underfit"], 1,
      "Any statistic learned from data must be fit on the training split alone."],
    ["ml-unsupervised", "intermediate", "PCA is applied before clustering primarily to:",
      ["Add labels", "Reduce dimensionality and noise so distances stay meaningful", "Increase the number of clusters", "Balance the classes"], 1,
      "In high dimensions distance concentrates; PCA restores useful structure."],
    ["deep-learning", "advanced", "Training loss oscillates violently and never converges. First thing to try:",
      ["Lower the learning rate", "Add more layers", "Remove normalisation", "Increase batch size to the full dataset"], 0,
      "Divergent oscillation is the canonical too-high learning rate symptom."],
    ["deep-learning", "advanced", "What does self-attention let a transformer do that an RNN struggles with?",
      ["Use fewer parameters", "Relate any two positions directly regardless of distance", "Avoid needing training data", "Run without GPUs"], 1,
      "Attention gives constant path length between positions, unlike sequential recurrence."],
    ["mlops", "advanced", "A model's live accuracy degrades over months while code is unchanged. Most likely cause:",
      ["A compiler bug", "Data/concept drift in the incoming distribution", "Insufficient RAM", "Too many unit tests"], 1,
      "Drift is the standard explanation for silent degradation without code changes."],
  ],

  cloud: [
    ["linux", "beginner", "Which command shows which process is listening on port 8080?",
      ["ls -l /proc", "ss -ltnp", "chmod 8080", "df -h"], 1,
      "`ss -ltnp` lists listening TCP sockets with the owning process."],
    ["networking", "beginner", "A domain resolves but connections hang on port 443. The most likely layer at fault is:",
      ["DNS", "Network reachability or the TLS listener, not name resolution", "The browser cache", "The HTML"], 1,
      "Resolution succeeded, so the failure is below HTTP — reachability or the TLS endpoint."],
    ["cloud-core", "beginner", "Object storage rather than a block volume is the right choice when you need:",
      ["A filesystem mounted to one VM", "Durable, HTTP-addressable storage for large static assets", "Low-level disk access", "In-memory caching"], 1,
      "Object stores are built for durable, massively scalable, HTTP-accessible blobs."],
    ["containers", "intermediate", "Copying package manifests and installing dependencies before copying source code exists to:",
      ["Reduce image size", "Keep the dependency layer cached when only source changes", "Improve runtime speed", "Satisfy the registry"], 1,
      "Layer caching: source edits then invalidate only the final layers."],
    ["containers", "intermediate", "Which practice most reduces container attack surface?",
      ["Run as root for convenience", "Use a minimal base image and a non-root user", "Install debugging tools in production images", "Disable image scanning"], 1,
      "Small base plus non-root user removes most of what an attacker could use."],
    ["kubernetes", "intermediate", "A pod is stuck in Pending. The most common cause is:",
      ["The image is too small", "No node has enough allocatable resources to schedule it", "The service has no selector", "Ingress is misconfigured"], 1,
      "Pending almost always means the scheduler cannot find a node that fits the requests."],
    ["kubernetes", "advanced", "What distinguishes a readiness probe from a liveness probe?",
      ["Nothing", "Readiness gates traffic; liveness restarts the container", "Liveness gates traffic; readiness restarts", "Both restart the pod"], 1,
      "Readiness removes a pod from endpoints; liveness failure triggers a restart."],
    ["iac", "intermediate", "Why is Terraform state a sensitive file?",
      ["It is large", "It can contain resource attributes including secrets, and controls destroy operations", "It is written in HCL", "It is only used locally"], 1,
      "State records real resource attributes and is the source of truth for changes."],
    ["cicd", "intermediate", "Which pipeline design best prevents a bad build reaching production?",
      ["Deploy on every commit to every environment", "Promote one tested artefact through environments with gates", "Rebuild separately per environment", "Skip tests on main"], 1,
      "Build once, promote the same artefact — rebuilding per environment loses the guarantee."],
    ["cloud-security", "advanced", "An application role has `*:*` permissions. The correct remediation is:",
      ["Rotate the access key only", "Scope the policy to the specific actions and resources it uses", "Move it to another account", "Add a second role with the same policy"], 1,
      "Least privilege: enumerate actual usage and grant exactly that."],
    ["observability", "advanced", "Requests are slow but every service reports healthy. The most useful signal is:",
      ["More log volume", "Distributed traces showing latency per hop", "A larger instance type", "Disabling metrics"], 1,
      "Traces attribute latency across service boundaries, which per-service health cannot."],
  ],

  "data-science": [
    ["stats", "beginner", "A 95% confidence interval means:",
      ["95% of the data lies inside it", "The procedure captures the true parameter in 95% of repeated samples", "There is a 95% chance the sample is correct", "The p-value is 0.95"], 1,
      "Confidence is a property of the long-run procedure, not of a single interval."],
    ["sql-analytics", "beginner", "Which computes a running total per student ordered by date?",
      ["GROUP BY student_id", "SUM(x) OVER (PARTITION BY student_id ORDER BY date)", "DISTINCT student_id", "HAVING SUM(x) > 0"], 1,
      "A window function with PARTITION BY and ORDER BY yields per-group running totals."],
    ["data-wrangling", "beginner", "An inner join unexpectedly drops rows. The most likely cause is:",
      ["Too many columns", "Missing or mismatched keys on one side", "The ORDER BY clause", "Using a CTE"], 1,
      "Inner joins keep only matched keys; nulls and type/format mismatches silently drop rows."],
    ["stats", "intermediate", "You test 20 hypotheses at α = 0.05 and find one significant result. You should:",
      ["Publish it", "Correct for multiple comparisons before believing it", "Lower α to 0.01 afterwards", "Increase the sample only"], 1,
      "At α = 0.05, roughly one false positive in 20 tests is expected by chance."],
    ["experimentation", "intermediate", "Checking an A/B test daily and stopping at the first significant result causes:",
      ["Higher statistical power", "Inflated false positive rate from repeated peeking", "Lower variance", "Nothing"], 1,
      "Optional stopping inflates type I error unless you use a sequential design."],
    ["model-eval", "intermediate", "Precision matters more than recall when:",
      ["Missing a positive is catastrophic", "A false positive is expensive — e.g. wrongly flagging a candidate", "Classes are balanced", "The model is linear"], 1,
      "Precision is the cost-of-false-positive metric."],
    ["data-viz", "intermediate", "Truncating a bar chart's y-axis at a non-zero value is problematic because:",
      ["Bars must be blue", "Bar length encodes magnitude, so truncation exaggerates differences", "It breaks tooltips", "It is slower to render"], 1,
      "Bars encode value by length from zero; moving the baseline distorts the comparison."],
    ["genai", "advanced", "Retrieval-augmented generation primarily addresses which limitation?",
      ["Slow inference", "The model lacking current or private knowledge at generation time", "Tokenisation errors", "GPU cost"], 1,
      "RAG supplies grounded context the model was never trained on."],
    ["genai", "advanced", "The most meaningful way to evaluate a RAG system is:",
      ["Count tokens generated", "Measure retrieval quality and answer groundedness against a labelled set", "Check response latency only", "Ask the model to grade itself with no rubric"], 1,
      "Separate retrieval and generation quality, and score against ground truth."],
    ["data-storytelling", "intermediate", "An executive summary of an analysis should lead with:",
      ["The data cleaning steps", "The decision the reader should make and the evidence for it", "The SQL queries", "The tool versions"], 1,
      "Lead with the conclusion; method belongs in the appendix."],
  ],

  cybersecurity: [
    ["sec-fundamentals", "beginner", "Defence in depth means:",
      ["One very strong control", "Multiple independent controls so a single failure is not fatal", "Encrypting everything twice", "Only using a firewall"], 1,
      "Layered controls ensure one bypass does not equal full compromise."],
    ["web-security", "beginner", "Which reliably prevents SQL injection?",
      ["Escaping quotes manually", "Parameterised queries / prepared statements", "Hiding error messages", "A client-side regex"], 1,
      "Parameterisation separates code from data so input can never become SQL."],
    ["web-security", "intermediate", "Stored XSS is best mitigated by:",
      ["Context-aware output encoding plus a strict CSP", "Blocking the word <script>", "HTTPS alone", "Disabling cookies"], 0,
      "Encode on output for the context, and add CSP as defence in depth."],
    ["web-security", "intermediate", "Changing an id in a URL exposes another user's record. This is:",
      ["CSRF", "Broken access control (IDOR)", "Clickjacking", "SSRF"], 1,
      "Missing server-side ownership checks — the classic insecure direct object reference."],
    ["cryptography", "intermediate", "Passwords must be stored using:",
      ["SHA-256", "A slow salted KDF such as scrypt, bcrypt or Argon2", "AES with a shared key", "Base64"], 1,
      "Fast hashes are brute-forceable; password hashing must be deliberately slow and salted."],
    ["cryptography", "advanced", "Reusing a nonce with AES-GCM causes:",
      ["Slower encryption", "Catastrophic loss of confidentiality and authenticity for those messages", "A padding error", "Nothing"], 1,
      "GCM nonce reuse leaks the keystream and lets forgery attacks recover the auth key."],
    ["network-security", "intermediate", "Network segmentation limits an attacker primarily by:",
      ["Encrypting traffic", "Restricting lateral movement after an initial foothold", "Blocking phishing", "Reducing latency"], 1,
      "Segmentation contains the blast radius of a compromised host."],
    ["secure-coding", "advanced", "Client-side role checks are insufficient because:",
      ["They are slow", "Anyone can call the API directly — authorisation must be enforced server-side", "They break dark mode", "They need TypeScript"], 1,
      "The browser is untrusted; the server is the only place authorisation counts."],
    ["incident-response", "advanced", "During active compromise, the correct order is:",
      ["Eradicate, then detect, then contain", "Detect, contain, eradicate, recover, then review", "Recover first, investigate later", "Notify press, then contain"], 1,
      "NIST's cycle: contain the bleeding before eradication and recovery."],
    ["grc", "advanced", "A risk register exists to:",
      ["Satisfy auditors only", "Track risks, owners, likelihood, impact and treatment decisions", "Store passwords", "Replace threat modelling"], 1,
      "It is the accountability record for which risks are accepted, mitigated or transferred."],
  ],
};

function buildBank(): AssessmentQuestion[] {
  const out: AssessmentQuestion[] = [];
  for (const [domainId, questions] of Object.entries(BANKS)) {
    questions.forEach(([skillId, level, prompt, options, correctIndex, explanation], i) => {
      out.push({
        id: `${domainId}-q${String(i + 1).padStart(2, "0")}`,
        domainId,
        skillId,
        level,
        prompt,
        options,
        correctIndex,
        explanation,
      });
    });
  }
  return out;
}

export const QUESTION_BANK: AssessmentQuestion[] = buildBank();

const byId = new Map(QUESTION_BANK.map((q) => [q.id, q]));

export function getQuestion(id: string): AssessmentQuestion | undefined {
  return byId.get(id);
}

export function questionsForDomain(domainId: string): AssessmentQuestion[] {
  return QUESTION_BANK.filter((q) => q.domainId === domainId);
}

/** Strip the answer key. Every path that sends a question to a client goes through this. */
export function toClientQuestion(q: AssessmentQuestion): ClientQuestion {
  const { correctIndex: _c, explanation: _e, ...rest } = q;
  void _c;
  void _e;
  return rest;
}

/**
 * Build a diagnostic for a domain at a declared level.
 *
 * Beginners never reach here (they skip the test). Intermediate learners are
 * probed on beginner+intermediate items; advanced learners get the full range,
 * weighted toward the harder end.
 */
export function buildDiagnostic(domainId: string, declaredLevel: LearningLevel, size = 10): AssessmentQuestion[] {
  const pool = questionsForDomain(domainId);
  const wanted: LearningLevel[] =
    declaredLevel === "advanced" ? ["beginner", "intermediate", "advanced"] : ["beginner", "intermediate"];

  const eligible = pool.filter((q) => wanted.includes(q.level));

  // Spread across distinct skills first so the result yields a usable skill map,
  // then top up with whatever remains.
  const bySkill = new Map<string, AssessmentQuestion[]>();
  for (const q of eligible) {
    const list = bySkill.get(q.skillId) ?? [];
    list.push(q);
    bySkill.set(q.skillId, list);
  }

  const picked: AssessmentQuestion[] = [];
  const queues = [...bySkill.values()];
  let round = 0;
  while (picked.length < size && queues.some((q) => q.length > round)) {
    for (const queue of queues) {
      if (picked.length >= size) break;
      const q = queue[round];
      if (q) picked.push(q);
    }
    round += 1;
  }

  return picked.slice(0, Math.min(size, eligible.length));
}
