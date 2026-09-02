import { Suspense } from "react";
import type { Metadata } from "next";
import { ResetPasswordForm } from "./reset-form";

export const metadata: Metadata = { title: "Choose a new password" };

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="h-80 animate-pulse rounded-2xl bg-muted" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
