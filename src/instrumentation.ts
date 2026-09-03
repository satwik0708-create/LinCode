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
    // Fail closed and fail now. A weak signing key is a full auth bypass, so
    // there is no version of this the server should start and serve. Throwing
    // here leaves Next.js up and answering 500 to everything, which reads like
    // a different bug; exiting says plainly that the server did not start.
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
      ].join("\n"),
    );
    process.exit(1);
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
