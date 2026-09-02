import "server-only";
import { getMatchedOpportunities, type MatchedOpportunity } from "./student";
import { read } from "@/lib/data/store";
import type { Opportunity } from "@/lib/types";

/** Attach employer names to matched opportunities in one pass. */
export async function getBoardEntries(
  userId: string,
  types?: Opportunity["type"][],
): Promise<{
  entries: Array<MatchedOpportunity & { organizationName: string }>;
  organizations: string[];
}> {
  const [matches, db] = await Promise.all([getMatchedOpportunities(userId, types), read()]);
  const names = new Map(db.organizations.map((o) => [o.id, o.name]));

  const entries = matches.map((match) => ({
    ...match,
    organizationName: names.get(match.opportunity.organizationId) ?? "Employer",
  }));

  return {
    entries,
    organizations: [...new Set(entries.map((e) => e.organizationName))].sort(),
  };
}
