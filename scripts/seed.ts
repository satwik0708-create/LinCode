/**
 * Reset the datastore to its seeded demo state.
 *
 * The store seeds itself on first read, so this exists for the second run
 * onwards: it drops accounts created during a demo (and any progress made on
 * them) and puts the fixture accounts back exactly as documented in the README.
 *
 *   npm run seed
 *
 * It never touches anything outside DATA_DIR (`.data/` by default), which is
 * gitignored.
 */
import { read, resetStore } from "@/lib/data/store";

async function main() {
  await resetStore();
  const db = await read(); // Re-reading an absent file triggers the seed.
  console.log(
    `Datastore reseeded: ${db.users.length} users, ${db.opportunities.length} opportunities, ` +
      `${db.applications.length} applications.`,
  );
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exitCode = 1;
});
