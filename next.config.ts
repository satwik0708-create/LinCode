import fs from "node:fs";
import type { NextConfig } from "next";

/**
 * Refuse to let a mis-cased working directory pass silently.
 *
 * Windows filesystems are case-insensitive but case-preserving, so `cd lincode`
 * into a folder actually named `LinCode` succeeds — and every path derived from
 * the working directory then carries the wrong spelling. Webpack is
 * case-sensitive and keys modules by absolute path, so it loads each dependency
 * twice, once per spelling. Two copies of Next's App Router context means the
 * provider publishes the router on one while `useRouter()` reads the other, and
 * the first page to render dies with "Invariant: expected layout router to be
 * mounted" — with nothing whatsoever wrong in the application.
 *
 * The error names none of this, so the check lives here, in the config Next
 * evaluates before webpack starts, where it can still be the first thing seen.
 */
function warnOnMisCasedWorkingDirectory() {
  const cwd = process.cwd();
  let real: string;
  try {
    // Resolves to the name as it is actually stored on disk.
    real = fs.realpathSync.native(cwd);
  } catch {
    return;
  }

  // Only a case-only difference is a problem. Anything else is a symlink or a
  // substituted drive, both of which are legitimate.
  if (real === cwd || real.toLowerCase() !== cwd.toLowerCase()) return;

  console.warn(
    [
      "",
      "=".repeat(78),
      "  The working directory is spelled differently from the folder on disk.",
      "",
      `    running from : ${cwd}`,
      `    folder is    : ${real}`,
      "",
      "  Webpack keys modules by absolute path, so it will load every dependency",
      "  twice — once per spelling. Two copies of Next's router context means the",
      '  app throws "expected layout router to be mounted" and no page renders.',
      "",
      "  Fix: stop the server, cd back in using the exact casing above, delete",
      "  the .next folder, and start again:",
      "",
      `    cd ${real}`,
      "    Remove-Item -Recurse -Force .next     # PowerShell",
      "    rmdir /s /q .next                     # cmd.exe",
      "    npm run dev",
      "=".repeat(78),
      "",
    ].join("\n"),
  );
}

warnOnMisCasedWorkingDirectory();

/**
 * Security headers are applied globally. They are deliberately strict:
 * the app never loads third-party scripts, so a tight CSP costs us nothing.
 */
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js injects inline bootstrap scripts; styles come from Tailwind's runtime <style> tags.
      "script-src 'self' 'unsafe-inline'" + (process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""),
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://images.unsplash.com",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
