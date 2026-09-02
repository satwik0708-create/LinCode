import { cookies } from "next/headers";
import { ok, requireSameOrigin } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { audit } from "@/lib/data/users";
import { getSession } from "@/lib/auth/guard";

export async function POST() {
  const blocked = await requireSameOrigin();
  if (blocked) return blocked;

  const session = await getSession();
  const store = await cookies();
  store.delete(SESSION_COOKIE);

  if (session) await audit({ userId: session.sub, action: "auth.logout", outcome: "success" });
  return ok({ next: "/" });
}
