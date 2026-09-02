import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ROLE_CARD_BY_VALUE, isSelectableRole } from "@/components/auth/role-cards";
import { SignupForm } from "./signup-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ role: string }>;
}): Promise<Metadata> {
  const { role } = await params;
  const card = isSelectableRole(role) ? ROLE_CARD_BY_VALUE.get(role) : undefined;
  return { title: card ? `Sign up as ${card.title}` : "Create your account" };
}

export default async function SignupCredentialsPage({
  params,
}: {
  params: Promise<{ role: string }>;
}) {
  const { role } = await params;
  // An unknown role in the URL is a 404, not a silent fallback — the role
  // decides the account's access, so it must be one we recognise.
  if (!isSelectableRole(role)) notFound();

  const card = ROLE_CARD_BY_VALUE.get(role)!;
  return <SignupForm role={role} card={card} />;
}
