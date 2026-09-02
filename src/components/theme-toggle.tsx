"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePreferences, type Theme } from "@/components/providers/preferences";
import { cn } from "@/lib/utils";

const OPTIONS: Array<{ value: Theme; label: string; icon: typeof Sun }> = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, resolvedTheme, setTheme } = usePreferences();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={cn("rounded-lg", className)} aria-label="Change theme">
          {resolvedTheme === "dark" ? <Moon className="size-4" /> : <Sun className="size-4" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {OPTIONS.map(({ value, label, icon: Icon }) => (
          <DropdownMenuItem
            key={value}
            onSelect={() => setTheme(value)}
            className={cn(theme === value && "bg-accent text-accent-foreground")}
          >
            <Icon className="size-4" />
            {label}
            {theme === value && <span className="ml-auto size-1.5 rounded-full bg-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function FontScaleControl({ className }: { className?: string }) {
  const { fontScale, increaseFont, decreaseFont } = usePreferences();
  const atMin = fontScale === "sm";
  const atMax = fontScale === "xl";

  return (
    <div className={cn("inline-flex items-center rounded-lg border bg-background", className)} role="group" aria-label="Interface text size">
      <Button
        variant="ghost" size="icon" onClick={decreaseFont} disabled={atMin}
        className="h-8 w-8 rounded-l-lg rounded-r-none text-xs" aria-label="Decrease text size"
      >
        A−
      </Button>
      <span className="w-px self-stretch bg-border" aria-hidden />
      <span className="px-2 text-xs font-medium tabular-nums text-muted-foreground" aria-live="polite">
        {fontScale === "sm" ? "S" : fontScale === "base" ? "M" : fontScale === "lg" ? "L" : "XL"}
      </span>
      <span className="w-px self-stretch bg-border" aria-hidden />
      <Button
        variant="ghost" size="icon" onClick={increaseFont} disabled={atMax}
        className="h-8 w-8 rounded-l-none rounded-r-lg text-sm" aria-label="Increase text size"
      >
        A+
      </Button>
    </div>
  );
}
