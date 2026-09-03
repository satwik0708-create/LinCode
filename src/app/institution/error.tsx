"use client";

import { ErrorPanel } from "@/components/shell/error-panel";

/**
 * Scoped to the institution workspace so a failure in one page does not take the
 * whole workspace with it: the shell, navigation and sign-out all keep working
 * while this segment is replaced.
 */
export default function InstitutionError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorPanel
      error={error}
      reset={reset}
      homeHref="/institution/dashboard"
      homeLabel="Back to my dashboard"
    />
  );
}
