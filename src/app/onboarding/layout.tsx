import Link from "next/link";
import { LogoMark } from "@/components/ui/hero-section-1";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignOutButton } from "@/components/shell/sign-out-button";
import { requireUser } from "@/lib/auth/guard";

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  // Onboarding is behind authentication but ahead of any role grant, so it
  // requires a user without requiring a role.
  const user = await requireUser();

  return (
    <div className="flex min-h-svh flex-col bg-muted/30">
      <header className="border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <LogoMark />
            <span className="text-sm font-semibold">LinCode</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-muted-foreground sm:inline">{user.name}</span>
            <ThemeToggle />
            <SignOutButton />
          </div>
        </div>
      </header>
      <main id="main" className="flex-1 px-4 py-8 sm:px-6 sm:py-12">{children}</main>
    </div>
  );
}
