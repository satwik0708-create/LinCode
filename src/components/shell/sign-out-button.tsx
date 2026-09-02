"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { postJson } from "@/lib/client";
import { cn } from "@/lib/utils";

export function SignOutButton({ className, variant = "ghost", withLabel = false }: {
  className?: string;
  variant?: "ghost" | "outline";
  withLabel?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function signOut() {
    setPending(true);
    await postJson("/api/auth/logout", {});
    router.replace("/");
    router.refresh();
  }

  return (
    <Button
      variant={variant}
      size={withLabel ? "sm" : "icon"}
      onClick={signOut}
      disabled={pending}
      className={cn("rounded-lg", className)}
      aria-label="Sign out"
    >
      <LogOut className="size-4" />
      {withLabel && "Sign out"}
    </Button>
  );
}
