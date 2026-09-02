import type { Role } from "@/lib/types";

export type SelectableRole = Exclude<Role, "admin">;

export interface RoleCard {
  value: SelectableRole;
  emoji: string;
  title: string;
  description: string;
  bullets: string[];
  gradient: string;
  /** What the next step asks for, shown so nobody is surprised by the form. */
  collects: string;
}

/**
 * The four roles a person can register as, defined once. The signup chooser and
 * the onboarding fallback picker both read this, so their wording cannot drift.
 */
export const ROLE_CARDS: RoleCard[] = [
  {
    value: "student",
    emoji: "🎓",
    title: "Student",
    description: "Develop skills, find internships, and become placement-ready.",
    bullets: [
      "Skill assessment and gap analysis",
      "Personalised learning paths",
      "Internships, jobs and a verified portfolio",
    ],
    gradient: "from-indigo-500 to-violet-500",
    collects: "your institution, course, graduation year and CGPA",
  },
  {
    value: "faculty",
    emoji: "🏛",
    title: "Faculty",
    description: "Faculty internships, FDPs, industrial training, consultancy and research.",
    bullets: [
      "Faculty internships and industrial training",
      "Faculty Development Programmes",
      "Consultancy and joint research",
    ],
    gradient: "from-emerald-500 to-teal-500",
    collects: "your institution, role, date of birth and experience",
  },
  {
    value: "industry",
    emoji: "💼",
    title: "Recruiter",
    description: "Post internships, jobs, projects and training programmes.",
    bullets: [
      "Post roles with the exact skills you need",
      "Discover candidates by skill compatibility",
      "Publish training and mentorship programmes",
    ],
    gradient: "from-sky-500 to-cyan-500",
    collects: "your company, your role in it and what you hire for",
  },
  {
    value: "institution",
    emoji: "🏢",
    title: "Institution",
    description: "Monitor skill development, internships, placements and analytics.",
    bullets: [
      "Cohort skill development dashboards",
      "Internship and placement tracking",
      "Department-level gap analytics",
    ],
    gradient: "from-amber-500 to-orange-500",
    collects: "your institution's details, then your own as its representative",
  },
];

export const ROLE_CARD_BY_VALUE = new Map(ROLE_CARDS.map((c) => [c.value, c]));

export function isSelectableRole(value: string): value is SelectableRole {
  return ROLE_CARD_BY_VALUE.has(value as SelectableRole);
}
