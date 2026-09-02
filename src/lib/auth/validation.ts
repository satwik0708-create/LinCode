import { z } from "zod";
import { SELECTABLE_ROLES } from "@/lib/types";
import { DOMAIN_IDS } from "@/lib/domain/domains";

/**
 * Every request body crossing the network boundary is parsed by one of these
 * schemas before any handler logic runs. Unvalidated input never reaches the
 * datastore.
 */

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(5)
  .max(254)
  .email("Enter a valid email address.");

/** Accepts +country-code or bare 10-digit Indian mobile numbers; stored normalised. */
export const mobileSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s()-]/g, ""))
  .refine((v) => /^(\+\d{6,15}|\d{10})$/.test(v), "Enter a valid mobile number.")
  .transform((v) => (v.startsWith("+") ? v : `+91${v}`));

export const passwordSchema = z
  .string()
  .min(10, "Use at least 10 characters.")
  .max(200, "That password is too long.");

export const nameSchema = z
  .string()
  .trim()
  .min(2, "Enter your full name.")
  .max(80)
  .regex(/^[\p{L}\p{M}\s.'-]+$/u, "Names can only contain letters, spaces and . ' -");

export const roleSchema = z.enum(SELECTABLE_ROLES as [string, ...string[]]);
export const levelSchema = z.enum(["beginner", "intermediate", "advanced"]);
export const domainIdSchema = z.enum(DOMAIN_IDS as [string, ...string[]]);

export const signupSchema = z
  .object({
    name: nameSchema,
    email: emailSchema.optional(),
    mobile: mobileSchema.optional(),
    password: passwordSchema,
    acceptedTerms: z.literal(true, { message: "You must accept the terms to continue." }),
  })
  .refine((v) => v.email || v.mobile, { message: "Provide an email address or a mobile number.", path: ["email"] });

export const loginSchema = z
  .object({
    method: z.enum(["email", "mobile"]),
    email: emailSchema.optional(),
    mobile: mobileSchema.optional(),
    password: z.string().min(1, "Enter your password.").max(200),
    remember: z.boolean().default(false),
  })
  .refine((v) => (v.method === "email" ? !!v.email : !!v.mobile), {
    message: "Enter your email address or mobile number.",
    path: ["email"],
  });

export const otpRequestSchema = z.object({ mobile: mobileSchema });

export const otpVerifySchema = z.object({
  mobile: mobileSchema,
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code."),
  remember: z.boolean().default(false),
});

export const forgotPasswordSchema = z
  .object({
    email: emailSchema.optional(),
    mobile: mobileSchema.optional(),
  })
  .refine((v) => v.email || v.mobile, { message: "Enter your email address or mobile number.", path: ["email"] });

export const resetPasswordSchema = z.object({
  token: z.string().min(20).max(400),
  password: passwordSchema,
});

export const selectRoleSchema = z.object({ role: roleSchema });

export const studentProfileSchema = z.object({
  institutionName: z.string().trim().min(2).max(120),
  degree: z.string().trim().min(2).max(80),
  branch: z.string().trim().min(2).max(80),
  graduationYear: z.coerce.number().int().min(1990).max(2040),
  cgpa: z.coerce.number().min(0).max(10).optional(),
  currentSemester: z.coerce.number().int().min(1).max(12).optional(),
  location: z.string().trim().max(80).optional(),
  careerInterests: z.array(z.string().trim().max(60)).max(8).default([]),
});

export const facultyProfileSchema = z.object({
  institutionName: z.string().trim().min(2).max(120),
  department: z.string().trim().min(2).max(80),
  designation: z.string().trim().min(2).max(80),
  yearsOfExperience: z.coerce.number().int().min(0).max(60),
  researchAreas: z.array(z.string().trim().max(60)).max(10).default([]),
  expertise: z.array(z.string().trim().max(60)).max(10).default([]),
});

export const industryProfileSchema = z.object({
  companyName: z.string().trim().min(2).max(120),
  designation: z.string().trim().min(2).max(80),
  industrySector: z.string().trim().min(2).max(80),
  companySize: z.string().trim().min(1).max(40),
  website: z.string().trim().url().max(200).optional().or(z.literal("")),
  hiringFor: z.array(z.string().trim().max(60)).max(10).default([]),
});

export const institutionProfileSchema = z.object({
  institutionName: z.string().trim().min(2).max(120),
  designation: z.string().trim().min(2).max(80),
  department: z.string().trim().max(80).optional(),
});

export const selectDomainsSchema = z.object({
  domainIds: z.array(domainIdSchema).min(1, "Choose at least one learning domain.").max(5),
});

export const setLevelsSchema = z.object({
  levels: z.record(domainIdSchema, levelSchema),
});

export const startAssessmentSchema = z.object({
  domainId: domainIdSchema,
  declaredLevel: levelSchema,
});

export const submitAssessmentSchema = z.object({
  assessmentId: z.string().min(4).max(64),
  answers: z.record(z.string().min(1).max(64), z.number().int().min(0).max(9)),
});

export const progressSchema = z.object({
  domainId: domainIdSchema,
  moduleId: z.string().trim().min(2).max(64),
  status: z.enum(["not_started", "in_progress", "completed"]),
  minutes: z.coerce.number().int().min(0).max(600).default(0),
});

export const applySchema = z.object({
  opportunityId: z.string().trim().min(4).max(64),
  coverNote: z.string().trim().max(1500).optional(),
});

export const applyProgramSchema = z.object({
  programId: z.string().trim().min(4).max(64),
  note: z.string().trim().max(1500).optional(),
});

export const advanceApplicationSchema = z.object({
  applicationId: z.string().trim().min(4).max(64),
  stage: z.enum(["applied", "under_review", "shortlisted", "interview", "selected", "rejected"]),
  note: z.string().trim().max(500).optional(),
});

export const postOpportunitySchema = z.object({
  type: z.enum(["internship", "job", "project", "apprenticeship"]),
  title: z.string().trim().min(4).max(120),
  description: z.string().trim().min(20).max(4000),
  location: z.string().trim().min(2).max(80),
  workMode: z.enum(["onsite", "remote", "hybrid"]),
  stipend: z.string().trim().max(60).optional(),
  salaryLpa: z.string().trim().max(60).optional(),
  durationMonths: z.coerce.number().int().min(0).max(36).optional(),
  domainIds: z.array(domainIdSchema).min(1).max(5),
  skillIds: z.array(z.string().trim().max(60)).min(1).max(20),
  mandatorySkillIds: z.array(z.string().trim().max(60)).max(20).default([]),
  degrees: z.array(z.string().trim().max(60)).max(10).default([]),
  branches: z.array(z.string().trim().max(60)).max(20).default([]),
  graduationYears: z.array(z.coerce.number().int().min(1990).max(2040)).max(10).default([]),
  minCgpa: z.coerce.number().min(0).max(10).optional(),
  openings: z.coerce.number().int().min(1).max(500),
  deadline: z.string().trim().min(8).max(40),
});

export const advisorSchema = z.object({
  question: z.string().trim().min(3, "Ask a question.").max(500),
  domainId: domainIdSchema.optional(),
});

export const settingsSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).optional(),
  fontScale: z.enum(["sm", "base", "lg", "xl"]).optional(),
  notifyEmail: z.boolean().optional(),
  notifyOpportunities: z.boolean().optional(),
  notifyStreak: z.boolean().optional(),
});

export const accountUpdateSchema = z.object({
  name: nameSchema.optional(),
  headline: z.string().trim().max(120).optional(),
  about: z.string().trim().max(1200).optional(),
  location: z.string().trim().max(80).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: passwordSchema,
});

export const addDomainSchema = z.object({
  domainId: domainIdSchema,
  level: levelSchema,
});

/** Flatten a ZodError into the `{ field: message }` shape the forms render. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    out[key] ??= issue.message;
  }
  return out;
}
