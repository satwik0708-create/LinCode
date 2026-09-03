"use client";

import { ErrorPanel } from "@/components/shell/error-panel";

/**
 * Catches render errors anywhere under the root layout that no nearer boundary
 * handled. The layout itself still renders, so the page keeps its theme,
 * providers and skip link — only the failed segment is replaced.
 */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorPanel error={error} reset={reset} />;
}
