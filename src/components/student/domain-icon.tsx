import { Brain, Cloud, Code2, LineChart, ShieldCheck, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS = { Code2, Brain, Cloud, LineChart, ShieldCheck, BookOpen } as const;

export function DomainIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name as keyof typeof ICONS] ?? BookOpen;
  return <Icon className={cn("size-5", className)} />;
}
