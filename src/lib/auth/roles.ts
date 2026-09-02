import type { Role } from "@/lib/types";

/** Where each role lands after authentication. */
export const ROLE_HOME: Record<Role, string> = {
  student: "/student/dashboard",
  faculty: "/faculty/dashboard",
  industry: "/industry/dashboard",
  institution: "/institution/dashboard",
  admin: "/admin/dashboard",
};

/** URL prefix each role owns. Used by middleware and by the server guards. */
export const ROLE_PREFIX: Record<Role, string> = {
  student: "/student",
  faculty: "/faculty",
  industry: "/industry",
  institution: "/institution",
  admin: "/admin",
};

/** Where each role begins its onboarding, straight after account creation. */
export const ONBOARDING_ENTRY: Record<Role, string> = {
  student: "/onboarding/student/profile",
  faculty: "/onboarding/faculty/profile",
  industry: "/onboarding/industry/profile",
  institution: "/onboarding/institution/profile",
  admin: "/admin/dashboard",
};

export const ROLE_LABEL: Record<Role, string> = {
  student: "Student",
  faculty: "Faculty / Academician",
  industry: "Industry / Recruiter",
  institution: "Institution",
  admin: "Administrator",
};

/** Reverse lookup: which role owns this path, if any. */
export function roleForPath(pathname: string): Role | null {
  for (const [role, prefix] of Object.entries(ROLE_PREFIX) as Array<[Role, string]>) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return role;
  }
  return null;
}

/**
 * Whether a set of grants may access a role's area.
 *
 * Deliberately not "admin can do anything": an administrator is granted the
 * institution role explicitly if they need institutional data. The only
 * implicit power admin has is over `/admin`.
 */
export function canAccess(roles: Role[], target: Role): boolean {
  return roles.includes(target);
}

export function homeFor(roles: Role[], activeRole: Role | null): string {
  if (activeRole && roles.includes(activeRole)) return ROLE_HOME[activeRole];
  const first = roles[0];
  return first ? ROLE_HOME[first] : "/onboarding/role";
}
