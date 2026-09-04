/**
 * Startup configuration check.
 *
 * Next.js calls `register()` once when the server boots. Anything certain to
 * break every request belongs here rather than at the first request that trips
 * over it: a missing signing key used to surface as a generic "Something went
 * wrong" on the first sign-in attempt, with the real reason only in the server
 * log — a long way from the person who ran `npm start`.
 */
const MIN_SECRET_LENGTH = 32;

export async function register() {
  // Runs in the edge runtime too, where process.env is a different object and
  // there is nothing useful to say; the node boot already covers it.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const secret = process.env.SESSION_SECRET;
  const production = process.env.NODE_ENV === "production";
  const usable = Boolean(secret) && secret!.length >= MIN_SECRET_LENGTH;

  if (usable) return;

  const generate = `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`;

  if (production) {
    // On a long-running server, exiting is the clearest possible signal: the
    // operator is watching a terminal and sees the server refuse to start.
    //
    // On a serverless host it is the opposite. Killing the invocation turns a
    // configuration mistake into a platform 500 with no message anywhere the
    // operator can reach — including /api/health, which exists precisely to
    // report this. There, log it and let the request through: auth still fails
    // closed, because signing a session without the key is impossible, but the
    // reason becomes visible instead of vanishing with the process.
    const serverless = Boolean(
      process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY,
    );

    console.error(
      [
        "",
        "LinCode cannot start: SESSION_SECRET is missing or too short.",
        "",
        secret
          ? `  It is set but only ${secret.length} characters; at least ${MIN_SECRET_LENGTH} are required.`
          : "  It is not set at all.",
        "",
        "  Create one and put it in .env.local:",
        `    ${generate}`,
        "    echo 'SESSION_SECRET=<the value above>' >> .env.local",
        "",
        "  `npm run dev` works without this. A production build does not:",
        "  sessions are signed with it, so every sign-in would fail.",
        "",
        serverless ? "  Open /api/health on the deployment for the current status." : "",
      ].join("\n"),
    );
    if (!serverless) process.exit(1);
    return;
  }

  // Development: say it once, plainly, and carry on with the fallback key.
  console.warn(
    [
      "",
      "  SESSION_SECRET is not set — using the built-in development key.",
      "  Fine for `npm run dev`. Before `npm run build && npm start`, set a real one:",
      `    ${generate}`,
      "",
    ].join("\n"),
  );
}
