"use client";

import {
  BookOpen, Boxes, Briefcase, Building2, ClipboardCheck, Circle, Factory, Flame,
  FlaskConical, FolderOpen, GraduationCap, Handshake, LayoutDashboard, LineChart,
  ListChecks, ScrollText, Settings, Sparkles, Target, User, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS = {
  BookOpen, Boxes, Briefcase, Building2, ClipboardCheck, Factory, Flame, FlaskConical,
  FolderOpen, GraduationCap, Handshake, LayoutDashboard, LineChart, ListChecks,
  ScrollText, Settings, Sparkles, Target, User, Users,
} as const;

export function NavIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name as keyof typeof ICONS] ?? Circle;
  return <Icon className={cn("size-4 shrink-0", className)} />;
}
