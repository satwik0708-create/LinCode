import type { Metadata } from "next";
import { requireRoleForOnboarding } from "@/lib/services/onboarding";
import { SimpleProfileForm } from "@/components/shell/simple-profile-form";

export const metadata: Metadata = { title: "Faculty profile" };

export default async function FacultyOnboardingPage() {
  await requireRoleForOnboarding("faculty");

  return (
    <SimpleProfileForm
      title="Set up your faculty profile"
      subtitle="This is what industry partners see when matching you to FDPs, consultancy work and research collaborations."
      endpoint="/api/onboarding/faculty/profile"
      submitLabel="Enter my portal"
      sections={[
        {
          heading: "Appointment",
          description: "Where you teach and in what capacity.",
          fields: [
            { kind: "text", name: "institutionName", label: "Institution", placeholder: "Government College of Engineering, Pune", required: true, span: true },
            { kind: "text", name: "department", label: "Department", placeholder: "Computer Engineering", required: true },
            { kind: "text", name: "designation", label: "Designation", placeholder: "Associate Professor", required: true },
            { kind: "number", name: "yearsOfExperience", label: "Years of experience", placeholder: "12", min: 0, max: 60, required: true },
          ],
        },
        {
          heading: "Expertise",
          description: "Used to match you with relevant programmes and industry partners.",
          fields: [
            {
              kind: "tags", name: "researchAreas", label: "Research areas", max: 10,
              options: ["Applied ML", "Computer Vision", "NLP", "Distributed Systems", "Edge Computing", "Cybersecurity", "Data Engineering", "HCI", "Engineering Education", "IoT"],
            },
            {
              kind: "tags", name: "expertise", label: "Teaching expertise", max: 10,
              options: ["Data Structures", "Algorithms", "Operating Systems", "Databases", "Computer Networks", "Machine Learning", "Web Technologies", "Cloud Computing", "Curriculum Design", "Software Engineering"],
            },
          ],
        },
      ]}
    />
  );
}
