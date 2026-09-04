import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

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

  const dataDir = path.resolve(process.cwd(), process.env.DATA_DIR || ".data");
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
        dataDirEnv: process.env.DATA_DIR ?? "(not set)",
        dataDirWritable: writable,
        nodeEnv: process.env.NODE_ENV,
        cwd: process.cwd(),
      },
      note:
        "Environment variables only take effect on a new deployment. After changing them in " +
        "Vercel, redeploy — and make sure the Production environment is ticked, not only Development.",
    },
    { status: problems.length === 0 ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
