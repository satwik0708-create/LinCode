import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/guard";
import { homeFor } from "@/lib/auth/roles";
import { RolePicker } from "./role-picker";

export const metadata: Metadata = { title: "Choose your role" };

export default async function RoleSelectionPage() {
  const user = await requireUser();

  // Someone who already holds a role does not get to browse this screen and
  // silently pick up another one.
  if (user.roles.length > 0) {
    redirect(user.roles.includes("student") && !user.onboardingComplete
      ? "/onboarding/student/profile"
      : homeFor(user.roles, user.activeRole));
  }

  return <RolePicker name={user.name} />;
}
