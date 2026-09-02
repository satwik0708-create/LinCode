import "server-only";
import { z } from "zod";
import {
  findOrCreateInstitutionByName, findOrCreateOrganizationByName, updateUser,
  upsertFacultyProfile, upsertIndustryProfile, upsertInstitutionProfile,
} from "@/lib/data/users";
import type { facultyProfileSchema, industryProfileSchema, institutionProfileSchema } from "@/lib/auth/validation";

/**
 * Non-student onboarding writes.
 *
 * Each handler writes only for the authenticated user id passed in by the route
 * — no request body carries a user id, so cross-account writes are impossible
 * by construction rather than by check.
 */
export const PROFILE_HANDLERS = {
  async faculty(userId: string, data: z.infer<typeof facultyProfileSchema>): Promise<string> {
    const institutionId = await findOrCreateInstitutionByName(data.institutionName);
    await upsertFacultyProfile(userId, { ...data, institutionId });
    await updateUser(userId, { institutionId, onboardingComplete: true });
    return "/faculty/dashboard";
  },

  async industry(userId: string, data: z.infer<typeof industryProfileSchema>): Promise<string> {
    const organizationId = await findOrCreateOrganizationByName(data.companyName, data.industrySector, data.companySize);
    await upsertIndustryProfile(userId, {
      ...data,
      website: data.website || undefined,
      organizationId,
    });
    await updateUser(userId, { organizationId, onboardingComplete: true });
    return "/industry/dashboard";
  },

  async institution(userId: string, data: z.infer<typeof institutionProfileSchema>): Promise<string> {
    const institutionId = await findOrCreateInstitutionByName(data.institutionName);
    await upsertInstitutionProfile(userId, {
      institutionId,
      designation: data.designation,
      department: data.department,
    });
    await updateUser(userId, { institutionId, onboardingComplete: true });
    return "/institution/dashboard";
  },
} as const;
