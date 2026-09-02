import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PreferencesProvider, PREFERENCES_BOOTSTRAP_SCRIPT } from "@/components/providers/preferences";

export const metadata: Metadata = {
  title: {
    default: "SkillBridge — skills, internships and placements on one platform",
    template: "%s · SkillBridge",
  },
  description:
    "Assess your skills, see the gap against real industry demand, follow a personalised learning path, and connect to the internships and jobs you are ready for.",
  applicationName: "SkillBridge",
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfcfe" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0f1c" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Applies theme + text scale before first paint so neither flashes. */}
        <script dangerouslySetInnerHTML={{ __html: PREFERENCES_BOOTSTRAP_SCRIPT }} />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Skip to content
        </a>
        <PreferencesProvider>{children}</PreferencesProvider>
      </body>
    </html>
  );
}
