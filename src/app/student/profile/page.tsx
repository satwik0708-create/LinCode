import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/guard";
import { getStudentProfile } from "@/lib/data/users";
import { PageHeader } from "@/components/shell/page-header";
import { ProfileEditor } from "./profile-editor";

export const metadata: Metadata = { title: "Profile" };

export default async function StudentProfilePage() {
  const user = await requireRole("student");
  const profile = await getStudentProfile(user.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Employers see this when you apply, and eligibility for every opportunity is checked against it."
      />
      <ProfileEditor
        initial={{
          name: user.name,
          email: user.email,
          mobile: user.mobile ?? "",
          headline: profile?.headline ?? "",
          about: profile?.about ?? "",
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
    </div>
  );
}
