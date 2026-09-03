"use client";

import { ErrorPanel } from "@/components/shell/error-panel";

/**
 * Scoped to the student workspace so a failure in one page does not take the
 * whole workspace with it: the shell, navigation and sign-out all keep working
 * while this segment is replaced.
 */
export default function StudentError({
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
      homeHref="/student/dashboard"
      homeLabel="Back to my dashboard"
    />
  );
}
