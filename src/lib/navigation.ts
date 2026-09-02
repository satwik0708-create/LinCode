import type { Role } from "@/lib/types";

export interface NavItem {
  href: string;
  label: string;
  /** lucide-react icon name, resolved in the client nav component. */
  icon: string;
  description?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

/**
 * Navigation is defined per role and never merged.
 *
 * A student's shell is built from STUDENT_NAV alone — the faculty, industry and
 * institution sections are not imported into their tree, let alone rendered and
 * hidden. The route guards enforce the same boundary on the server, so this is
 * presentation of an access rule rather than the rule itself.
 */
export const NAVIGATION: Record<Role, NavSection[]> = {
  student: [
    {
      title: "Learn",
      items: [
        { href: "/student/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
        { href: "/student/learning", label: "My Learning", icon: "BookOpen" },
        { href: "/student/assessment", label: "Skill Assessment", icon: "ClipboardCheck" },
        { href: "/student/skill-gap", label: "Skill Gap", icon: "Target" },
        { href: "/student/streak", label: "Learning Streak", icon: "Flame" },
      ],
    },
    {
      title: "Opportunities",
      items: [
        { href: "/student/internships", label: "Internships", icon: "Briefcase" },
        { href: "/student/jobs", label: "Jobs", icon: "Building2" },
        { href: "/student/applications", label: "Applications", icon: "ListChecks" },
      ],
    },
    {
      title: "You",
      items: [
        { href: "/student/portfolio", label: "Digital Portfolio", icon: "FolderOpen" },
        { href: "/student/career-advisor", label: "AI Career Advisor", icon: "Sparkles" },
        { href: "/student/profile", label: "Profile", icon: "User" },
        { href: "/student/settings", label: "Settings", icon: "Settings" },
      ],
    },
  ],

  faculty: [
    {
      title: "Overview",
      items: [{ href: "/faculty/dashboard", label: "Dashboard", icon: "LayoutDashboard" }],
    },
    {
      title: "Industry engagement",
      items: [
        { href: "/faculty/internships", label: "Faculty Internships", icon: "Briefcase" },
        { href: "/faculty/fdp", label: "FDPs", icon: "GraduationCap" },
        { href: "/faculty/training", label: "Industrial Training", icon: "Factory" },
        { href: "/faculty/research", label: "Research & Consultancy", icon: "FlaskConical" },
        { href: "/faculty/collaboration", label: "Collaboration", icon: "Handshake" },
      ],
    },
    {
      title: "You",
      items: [
        { href: "/faculty/applications", label: "My Applications", icon: "ListChecks" },
        { href: "/faculty/settings", label: "Settings", icon: "Settings" },
      ],
    },
  ],

  industry: [
    {
      title: "Overview",
      items: [{ href: "/industry/dashboard", label: "Dashboard", icon: "LayoutDashboard" }],
    },
    {
      title: "Postings",
      items: [
        { href: "/industry/internships", label: "Internships", icon: "Briefcase" },
        { href: "/industry/jobs", label: "Jobs", icon: "Building2" },
        { href: "/industry/projects", label: "Projects & Apprenticeships", icon: "Boxes" },
        { href: "/industry/training", label: "Training Programmes", icon: "GraduationCap" },
      ],
    },
    {
      title: "Recruitment",
      items: [
        { href: "/industry/applicants", label: "Applicants", icon: "Users" },
        { href: "/industry/settings", label: "Settings", icon: "Settings" },
      ],
    },
  ],

  institution: [
    {
      title: "Overview",
      items: [{ href: "/institution/dashboard", label: "Dashboard", icon: "LayoutDashboard" }],
    },
    {
      title: "Cohort",
      items: [
        { href: "/institution/students", label: "Students", icon: "Users" },
        { href: "/institution/skills", label: "Skill Development", icon: "Target" },
        { href: "/institution/internships", label: "Internships", icon: "Briefcase" },
        { href: "/institution/placements", label: "Placements", icon: "Building2" },
        { href: "/institution/analytics", label: "Analytics", icon: "LineChart" },
        { href: "/institution/verifications", label: "Verifications", icon: "ShieldCheck" },
      ],
    },
    {
      title: "You",
      items: [{ href: "/institution/settings", label: "Settings", icon: "Settings" }],
    },
  ],

  admin: [
    {
      title: "Platform",
      items: [
        { href: "/admin/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
        { href: "/admin/audit", label: "Audit Log", icon: "ScrollText" },
      ],
    },
  ],
};

export const ROLE_WORKSPACE_LABEL: Record<Role, string> = {
  student: "Student workspace",
  faculty: "Faculty portal",
  industry: "Recruiter portal",
  institution: "Institution dashboard",
  admin: "Platform administration",
};
