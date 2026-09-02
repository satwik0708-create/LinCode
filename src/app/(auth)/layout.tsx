import Link from "next/link";
import { LogoMark } from "@/components/ui/hero-section-1";
import { ThemeToggle } from "@/components/theme-toggle";
import { CheckCircle2 } from "lucide-react";

const HIGHLIGHTS = [
  "Adaptive assessment per learning domain — not one generic quiz",
  "A skill gap measured against live industry postings",
  "A learning path that skips what you have already proven",
  "Internships and jobs ranked by real skill compatibility",
  "A portfolio your institution and employers can verify",
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col lg:flex-row">
      {/* Brand panel — hidden on small screens where it would just push the form down. */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-primary via-primary to-chart-3 p-10 text-primary-foreground lg:flex lg:w-[44%] lg:flex-col lg:justify-between xl:p-14">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_20%,white,transparent_45%),radial-gradient(circle_at_80%_60%,white,transparent_40%)]" />
        <Link href="/" className="relative flex items-center gap-2.5">
          <LogoMark className="bg-white/15 shadow-none backdrop-blur" />
          <span className="text-lg font-semibold tracking-tight">LinCode</span>
        </Link>

        <div className="relative max-w-md">
          <h2 className="text-balance text-3xl font-semibold leading-tight tracking-tight xl:text-4xl">
            The full journey from skill gap to placement.
          </h2>
          <ul className="mt-8 space-y-3.5">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex gap-3 text-sm text-primary-foreground/90">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-primary-foreground/70">
          Role-based access · Server-enforced authorisation · Verified portfolios
        </p>
      </aside>

      <main id="main" className="flex flex-1 flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6">
          <Link href="/" className="flex items-center gap-2 lg:invisible">
            <LogoMark />
            <span className="text-sm font-semibold">LinCode</span>
          </Link>
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center px-4 pb-12 sm:px-6">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </main>
    </div>
  );
}
