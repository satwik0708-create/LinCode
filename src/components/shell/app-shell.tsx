"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle, FontScaleControl } from "@/components/theme-toggle";
import { SignOutButton } from "@/components/shell/sign-out-button";
import { NavIcon } from "@/components/shell/nav-icon";
import { LogoMark } from "@/components/ui/hero-section-1";
import { cn, initials } from "@/lib/utils";
import type { NavSection } from "@/lib/navigation";
import type { Notification } from "@/lib/types";

/**
 * The authenticated application shell.
 *
 * It renders exactly the sections it is handed. Each role's layout passes its
 * own navigation, so no other role's links exist in this tree at all — there is
 * nothing to reveal by inspecting the DOM.
 */
export function AppShell({
  sections,
  workspaceLabel,
  user,
  notifications,
  settingsHref,
  profileHref,
  children,
}: {
  sections: NavSection[];
  workspaceLabel: string;
  user: { name: string; email: string };
  notifications: Notification[];
  settingsHref: string;
  profileHref?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // Close the drawer whenever the route changes, so a tap never leaves it open.
  React.useEffect(() => setMobileOpen(false), [pathname]);

  const unread = notifications.filter((n) => !n.read).length;
  const activeItem = sections.flatMap((s) => s.items).find((item) => isActive(pathname, item.href));

  return (
    <div className="flex min-h-svh bg-muted/30">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col border-r bg-background lg:flex">
        <div className="flex h-16 items-center gap-2 border-b px-5">
          <LogoMark />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight">LinCode</p>
            <p className="truncate text-[11px] text-muted-foreground">{workspaceLabel}</p>
          </div>
        </div>
        <NavList sections={sections} pathname={pathname} className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4" />
        <div className="border-t p-3">
          <UserCard user={user} settingsHref={settingsHref} profileHref={profileHref} />
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r bg-background shadow-xl">
            <div className="flex h-16 items-center justify-between gap-2 border-b px-4">
              <div className="flex items-center gap-2">
                <LogoMark />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold leading-tight">LinCode</p>
                  <p className="truncate text-[11px] text-muted-foreground">{workspaceLabel}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} aria-label="Close navigation">
                <X className="size-4" />
              </Button>
            </div>
            <NavList sections={sections} pathname={pathname} className="flex-1 overflow-y-auto px-3 py-4" />
            <div className="border-t p-3">
              <UserCard user={user} settingsHref={settingsHref} profileHref={profileHref} />
            </div>
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur sm:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
            <Menu className="size-5" />
          </Button>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{activeItem?.label ?? workspaceLabel}</p>
            <p className="hidden truncate text-xs text-muted-foreground sm:block">{workspaceLabel}</p>
          </div>

          <FontScaleControl className="hidden sm:inline-flex" />
          <ThemeToggle />
          <NotificationBell notifications={notifications} unread={unread} />
        </header>

        <main id="main" className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

function isActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  // Treat nested routes as active for their section root, but never let
  // "/student/jobs" light up "/student/j".
  return pathname.startsWith(`${href}/`);
}

function NavList({ sections, pathname, className }: { sections: NavSection[]; pathname: string; className?: string }) {
  return (
    <nav className={className} aria-label="Main">
      {sections.map((section) => (
        <div key={section.title} className="mb-5 last:mb-0">
          <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {section.title}
          </p>
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-primary/10 font-medium text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    {/* Active marker: a bar as well as colour and weight, so the
                        state does not rely on colour perception alone. */}
                    <span
                      className={cn(
                        "absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-primary transition-opacity",
                        active ? "opacity-100" : "opacity-0",
                      )}
                      aria-hidden
                    />
                    <NavIcon name={item.icon} />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function UserCard({
  user, settingsHref, profileHref,
}: {
  user: { name: string; email: string };
  settingsHref: string;
  profileHref?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex w-full items-center gap-2.5 rounded-lg p-2 text-left transition-colors hover:bg-accent">
          <Avatar>
            <AvatarFallback>{initials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-56">
        <DropdownMenuLabel>Account</DropdownMenuLabel>
        {profileHref && (
          <DropdownMenuItem asChild>
            <Link href={profileHref}><NavIcon name="User" />Profile</Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link href={settingsHref}><NavIcon name="Settings" />Settings</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="p-1">
          <SignOutButton variant="outline" withLabel className="w-full justify-start" />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NotificationBell({ notifications, unread }: { notifications: Notification[]; unread: number }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-lg" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}>
          <Bell className="size-4" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          Notifications
          {unread > 0 && <Badge variant="default">{unread} new</Badge>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 && (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">Nothing new right now.</p>
        )}
        {notifications.slice(0, 6).map((notification) => (
          <DropdownMenuItem key={notification.id} asChild>
            <Link href={notification.href ?? "#"} className="flex flex-col items-start gap-0.5 py-2.5">
              <span className="flex w-full items-center gap-2">
                <span className={cn("size-1.5 shrink-0 rounded-full", notification.read ? "bg-transparent" : "bg-primary")} />
                <span className="truncate text-sm font-medium">{notification.title}</span>
              </span>
              <span className="line-clamp-2 pl-3.5 text-xs text-muted-foreground">{notification.body}</span>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
