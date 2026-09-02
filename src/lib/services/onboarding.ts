import "server-only";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/guard";
import { canAccess, homeFor } from "@/lib/auth/roles";
import type { Role, User } from "@/lib/types";

/**
 * Guard for onboarding screens.
 *
 * Same authority as `requireRole`, minus the "onboarding must be complete"
 * check — these are the screens that complete it.
 */
export async function requireRoleForOnboarding(role: Role): Promise<User> {
  const user = await requireUser();
  if (!canAccess(user.roles, role)) {
    redirect(user.roles.length ? homeFor(user.roles, user.activeRole) : "/onboarding/role");
  }
  return user;
}
