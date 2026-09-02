import type { Metadata } from "next";
import { requireRoleForOnboarding } from "@/lib/services/onboarding";
import { getStudentProfile } from "@/lib/data/users";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Your profile" };

export default async function StudentProfilePage() {
  const user = await requireRoleForOnboarding("student");
  const profile = await getStudentProfile(user.id);

  return (
    <ProfileForm
      name={user.name}
      initial={{
        institutionName: profile?.institutionName ?? "",
        degree: profile?.degree ?? "",
        branch: profile?.branch ?? "",
        graduationYear: profile?.graduationYear ?? new Date().getFullYear() + 1,
        cgpa: profile?.cgpa,
        currentSemester: profile?.currentSemester,
        location: profile?.location ?? "",
        careerInterests: profile?.careerInterests ?? [],
      }}
    />
  );
}
