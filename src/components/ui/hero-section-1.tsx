"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronRight, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextEffect } from "@/components/ui/text-effect";
import { AnimatedGroup } from "@/components/ui/animated-group";
import { cn } from "@/lib/utils";

/**
 * Landing-page hero.
 *
 * This header belongs to the marketing surface only. The authenticated app has
 * its own role-aware shell (src/components/shell) — deliberately not this one,
 * so a signed-in student never sees marketing navigation or another role's links.
 */

const transitionVariants = {
  item: {
    hidden: { opacity: 0, filter: "blur(12px)", y: 12 },
    visible: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: { type: "spring" as const, bounce: 0.3, duration: 1.5 },
    },
  },
};

export function HeroSection() {
  // If the stock photo cannot load, drop it entirely and let the designed panel
  // stand on its own rather than showing a broken-image frame.
  const [imageFailed, setImageFailed] = React.useState(false);

  return (
    <>
      <HeroHeader />
      <main className="overflow-x-hidden">
        <section className="relative">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute inset-0 grid-pattern opacity-40 [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]" />
            <div className="absolute left-1/2 top-[-10rem] h-[36rem] w-[64rem] -translate-x-1/2 rounded-full bg-primary/12 blur-3xl" />
          </div>

          <div className="pb-20 pt-28 md:pb-28 md:pt-36 lg:pb-32 lg:pt-44">
            <div className="relative mx-auto flex max-w-7xl flex-col px-6 lg:px-8">
              <div className="mx-auto max-w-4xl text-center">
                <AnimatedGroup variants={{ container: { visible: { transition: { delayChildren: 0.2, staggerChildren: 0.08 } } }, item: transitionVariants.item }}>
                  <Link
                    href="/signup"
                    className="group mx-auto flex w-fit items-center gap-3 rounded-full border bg-card p-1 pl-4 text-sm shadow-sm transition-colors hover:bg-accent"
                  >
                    <span className="text-foreground">Built for Smart India Hackathon 2025</span>
                    <span className="block h-4 w-px bg-border" />
                    <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform duration-300 group-hover:translate-x-0.5">
                      <ArrowRight className="size-3.5" />
                    </span>
                  </Link>
                </AnimatedGroup>

                <TextEffect
                  preset="fade-in-blur"
                  speedSegment={0.3}
                  as="h1"
                  className="mt-8 text-balance text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
                >
                  From skill gap to placement, on one platform
                </TextEffect>

                <TextEffect
                  per="line"
                  preset="fade-in-blur"
                  speedSegment={0.3}
                  delay={0.5}
                  as="p"
                  className="mx-auto mt-6 max-w-2xl text-balance text-base text-muted-foreground sm:text-lg"
                >
                  LinCode assesses what you actually know, shows you the gap against real industry demand, builds the learning path that closes it — then connects you to the internships and jobs you are ready for.
                </TextEffect>

                <AnimatedGroup
                  variants={{
                    container: { visible: { transition: { staggerChildren: 0.06, delayChildren: 0.9 } } },
                    item: transitionVariants.item,
                  }}
                  className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
                >
                  <Button asChild size="lg" className="h-12 rounded-xl px-7 text-base">
                    <Link href="/signup">
                      Get started
                      <ArrowRight className="ml-1 size-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="h-12 rounded-xl px-7 text-base">
                    <Link href="/login">Sign in</Link>
                  </Button>
                </AnimatedGroup>

                <AnimatedGroup
                  variants={{
                    container: { visible: { transition: { staggerChildren: 0.05, delayChildren: 1.1 } } },
                    item: transitionVariants.item,
                  }}
                  className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground"
                >
                  {[
                    "Skill assessment",
                    "AI skill-gap analysis",
                    "Personalised learning",
                    "Internships & jobs",
                    "Verified digital portfolio",
                  ].map((item) => (
                    <span key={item} className="flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full bg-primary" />
                      {item}
                    </span>
                  ))}
                </AnimatedGroup>
              </div>
            </div>

            <AnimatedGroup
              variants={{
                container: { visible: { transition: { staggerChildren: 0.05, delayChildren: 1.3 } } },
                item: transitionVariants.item,
              }}
            >
              <div className="relative mt-16 px-6 sm:mt-20 lg:px-8">
                <div className="mx-auto max-w-6xl overflow-hidden rounded-2xl border bg-card shadow-xl ring-1 ring-border/50">
                  <div className="flex items-center gap-1.5 border-b bg-muted/50 px-4 py-3">
                    <span className="size-2.5 rounded-full bg-destructive/50" />
                    <span className="size-2.5 rounded-full bg-warning/50" />
                    <span className="size-2.5 rounded-full bg-success/50" />
                    <span className="ml-3 truncate text-xs text-muted-foreground">lincode.app / student / dashboard</span>
                  </div>
                  {/* The gradient sits beneath the photo, so a slow or blocked
                      image degrades into a designed panel rather than a broken frame. */}
                  <div className="relative aspect-[16/9] w-full bg-gradient-to-br from-primary/25 via-chart-3/20 to-chart-2/25">
                    <div aria-hidden className="absolute inset-0 grid-pattern opacity-30" />
                    {!imageFailed && (
                      <Image
                        src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1600&q=80"
                        alt="Students collaborating on a project"
                        fill
                        priority
                        sizes="(max-width: 1024px) 100vw, 72rem"
                        className="object-cover"
                        onError={() => setImageFailed(true)}
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 grid gap-3 p-5 sm:grid-cols-3 sm:p-8">
                      {[
                        { label: "Placement readiness", value: "78%" },
                        { label: "Skill gaps closed", value: "12 of 17" },
                        { label: "Learning streak", value: "7 days" },
                      ].map((stat) => (
                        <div key={stat.label} className="rounded-xl border bg-card/90 p-4 backdrop-blur">
                          <p className="text-xs text-muted-foreground">{stat.label}</p>
                          <p className="mt-1 text-2xl font-semibold tracking-tight">{stat.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedGroup>
          </div>
        </section>
      </main>
    </>
  );
}

const menuItems = [
  { name: "How it works", href: "#how-it-works" },
  { name: "For students", href: "#students" },
  { name: "For industry", href: "#industry" },
  { name: "For institutions", href: "#institutions" },
];

export function HeroHeader() {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header>
      <nav className="fixed z-30 w-full px-2 pt-2">
        <div
          className={cn(
            "mx-auto max-w-7xl rounded-2xl px-4 transition-all duration-300 lg:px-8",
            scrolled && "border bg-background/80 backdrop-blur-lg shadow-sm",
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-4 py-3 lg:gap-0 lg:py-4">
            <div className="flex w-full items-center justify-between gap-8 lg:w-auto">
              <Link href="/" aria-label="LinCode home" className="flex items-center gap-2">
                <LogoMark />
                <span className="text-base font-semibold tracking-tight">LinCode</span>
              </Link>

              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
                className="relative z-20 -m-2.5 block cursor-pointer p-2.5 lg:hidden"
              >
                {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              </button>
            </div>

            <div className="hidden lg:block">
              <ul className="flex gap-8 text-sm">
                {menuItems.map((item) => (
                  <li key={item.name}>
                    <Link href={item.href} className="text-muted-foreground transition-colors hover:text-foreground">
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="hidden items-center gap-2 lg:flex">
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/signup">
                  Get started
                  <ChevronRight className="size-4" />
                </Link>
              </Button>
            </div>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="w-full rounded-2xl border bg-background p-5 shadow-lg lg:hidden"
                >
                  <ul className="space-y-3 text-base">
                    {menuItems.map((item) => (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          onClick={() => setMenuOpen(false)}
                          className="block text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5 flex flex-col gap-2">
                    <Button asChild variant="outline">
                      <Link href="/login">Sign in</Link>
                    </Button>
                    <Button asChild>
                      <Link href="/signup">Get started</Link>
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>
    </header>
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-chart-3 text-primary-foreground shadow-sm",
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" fill="none" className="size-4.5 h-[18px] w-[18px]">
        <path d="M9.3 8.4 5.7 12l3.6 3.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14.7 8.4 18.3 12l-3.6 3.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 7.2v9.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </span>
  );
}
