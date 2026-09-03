"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, Home, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * What a caught runtime error looks like to the person it happened to.
 *
 * Two rules shape this. The message shown is generic in production and the real
 * one only in development: a server error's text can name internal paths and
 * query shapes, and Next.js already replaces it with a digest for that reason —
 * rendering `error.message` unconditionally would hand back what the framework
 * deliberately withheld. And every state offers a way out, because a dead end
 * with no button is indistinguishable from the app being broken for good.
 */
export function ErrorPanel({
  error,
  reset,
  homeHref = "/",
  homeLabel = "Go to the home page",
  title = "Something went wrong on this page",
}: {
  error: Error & { digest?: string };
  reset?: () => void;
  homeHref?: string;
  homeLabel?: string;
  title?: string;
}) {
  // Logged so the detail survives where a developer can actually read it, even
  // though the interface does not show it.
  React.useEffect(() => {
    console.error("[lincode] render error:", error);
  }, [error]);

  const showDetail = process.env.NODE_ENV === "development";

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center px-4 py-16">
      <Card className="w-full">
        <CardContent className="space-y-5 p-6 sm:p-8">
          <span className="flex size-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <AlertTriangle className="size-5" />
          </span>

          <div className="space-y-2">
            <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground">
              The rest of the app is unaffected. Try again — if it keeps happening, the reference below
              identifies this exact failure in the server log.
            </p>
          </div>

          {showDetail && (
            <pre className="max-h-40 overflow-auto rounded-lg bg-muted p-3 text-xs text-muted-foreground scrollbar-thin">
              {error.message}
            </pre>
          )}

          {error.digest && (
            <p className="text-xs text-muted-foreground">
              Reference: <code className="rounded bg-muted px-1.5 py-0.5">{error.digest}</code>
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            {reset && (
              <Button onClick={reset}>
                <RotateCw className="size-4" />
                Try again
              </Button>
            )}
            <Button asChild variant="outline">
              <Link href={homeHref}>
                <Home className="size-4" />
                {homeLabel}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
