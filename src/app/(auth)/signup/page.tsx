import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ROLE_CARDS } from "@/components/auth/role-cards";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Create your account" };

/**
 * Registration starts with the role, not the credentials.
 *
 * Which role you are determines what the account can reach and what the next
 * step asks for, so choosing it first makes the rest of the flow coherent —
 * and the account is created with its role already granted.
 */
export default function SignupRolePage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">How are you joining?</h1>
        <p className="text-sm text-muted-foreground">
          This decides the workspace you get. You will only ever see the features for your role.
        </p>
      </div>

      <ul className="space-y-2.5">
        {ROLE_CARDS.map((role) => (
          <li key={role.value}>
            <Link
              href={`/signup/${role.value}`}
              className={cn(
                "group flex items-start gap-3.5 rounded-xl border bg-card p-4 transition-all",
                "hover:-translate-y-0.5 hover:border-primary hover:shadow-md",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              )}
            >
              <span
                className={cn(
                  "flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-xl",
                  role.gradient,
                )}
                aria-hidden
              >
                {role.emoji}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{role.title}</span>
                <span className="mt-0.5 block text-sm text-muted-foreground">{role.description}</span>
              </span>
              <ArrowRight className="mt-3 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>
          </li>
        ))}
      </ul>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
