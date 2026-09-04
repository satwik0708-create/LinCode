import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { DATA_DIR } from "@/lib/data/store";

/**
 * Deployment self-check.
 *
 * Every 500 in this app deliberately hides its cause from the browser and logs
 * it server-side instead — right for users, unhelpful for whoever is deploying
 * it and cannot easily reach the logs. This reports the two things that make
 * sign-in and sign-up fail on a host, and nothing else.
 *
 * It reveals no secret: whether SESSION_SECRET is set and long enough, never
 * any part of its value. DATA_DIR is the operator's own setting echoed back.
 */
export const dynamic = "force-dynamic";

const MIN_SECRET_LENGTH = 32;

export async function GET() {
  const secret = process.env.SESSION_SECRET;
  const secretOk = Boolean(secret) && secret!.length >= MIN_SECRET_LENGTH;

  // The store's own resolved directory, so this reports what the app actually
  // uses rather than a second guess at the same rule.
  const dataDir = DATA_DIR;
  let writable = false;
  let writeError: string | undefined;
  try {
    // Actually write, rather than checking permissions: only a real write
    // proves it, and on a read-only filesystem this is exactly what fails.
    await fs.mkdir(dataDir, { recursive: true });
    const probe = path.join(dataDir, `.health-${process.pid}`);
    await fs.writeFile(probe, "ok");
    await fs.rm(probe, { force: true });
    writable = true;
  } catch (error) {
    writeError = (error as NodeJS.ErrnoException)?.code ?? String(error);
  }

  const problems: string[] = [];
  if (!secret) {
    problems.push("SESSION_SECRET is not set. Sign-in cannot work without it.");
  } else if (!secretOk) {
    problems.push(
      `SESSION_SECRET is only ${secret.length} characters; at least ${MIN_SECRET_LENGTH} are required.`,
    );
  }
  if (!writable) {
    problems.push(
      `The datastore directory is not writable (${writeError}). On a serverless host only ` +
        "/tmp is — set DATA_DIR=/tmp and redeploy.",
    );
  }

  return NextResponse.json(
    {
      ok: problems.length === 0,
      problems,
      checks: {
        sessionSecret: secret ? (secretOk ? "ok" : `too short (${secret.length})`) : "missing",
        dataDir,
        // Distinguishes "not set" from "set to an empty value", which look the
        // same from a dashboard and behave the same in code.
        dataDirEnv:
          process.env.DATA_DIR === undefined
            ? "(not set)"
            : process.env.DATA_DIR.trim() === ""
              ? "(set, but empty — ignored)"
              : process.env.DATA_DIR,
        dataDirWritable: writable,
        nodeEnv: process.env.NODE_ENV,
        cwd: process.cwd(),
        // Which Vercel environment is actually serving this. A URL produced by
        // a git push is a Preview deployment, and a variable ticked only for
        // Production does not exist there — the commonest reason a variable
        // looks set in the dashboard yet reads as missing here.
        vercelEnv: process.env.VERCEL_ENV ?? "(not on Vercel)",
        deployment: process.env.VERCEL_URL ?? "(not on Vercel)",
        commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "(unknown)",
      },
      note:
        `This is the "${process.env.VERCEL_ENV ?? "local"}" environment. A variable must be ticked ` +
        "for the environment serving this URL — a git-push URL is Preview, not Production — and " +
        "environment changes only apply to a NEW deployment, so redeploy after editing them.",
    },
    { status: problems.length === 0 ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
