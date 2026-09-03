import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Page not found" };

/**
 * Shown for an unmatched URL and wherever `notFound()` is called — the signup
 * route uses it for an unknown role, for one.
 *
 * It deliberately offers only public destinations. Listing the role workspaces
 * here would tell an unauthenticated visitor which ones exist, and a 404 is not
 * a place to start leaking the shape of the app.
 */
export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center px-4 py-16">
      <Card className="w-full">
        <CardContent className="space-y-5 p-6 sm:p-8">
          <span className="flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <FileQuestion className="size-5" />
          </span>
          <div className="space-y-2">
            <h1 className="text-xl font-semibold tracking-tight">Page not found</h1>
            <p className="text-sm text-muted-foreground">
              That address does not match anything here. It may have moved, or the link may be incomplete.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/">Go to the home page</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
