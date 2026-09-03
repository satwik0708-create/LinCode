"use client";

import * as React from "react";
import { readStored, writeStored } from "@/lib/storage";

/**
 * Appearance preferences (theme + interface scale).
 *
 * Both persist in localStorage and are applied to <html> before paint by the
 * inline script in the root layout, so there is no flash of the wrong theme or
 * the wrong text size on reload.
 */

export type Theme = "light" | "dark" | "system";
export type FontScale = "sm" | "base" | "lg" | "xl";

export const FONT_SCALES: Record<FontScale, { label: string; value: number; hint: string }> = {
  sm: { label: "Small", value: 0.9, hint: "Compact — more on screen" },
  base: { label: "Default", value: 1, hint: "Recommended" },
  lg: { label: "Large", value: 1.125, hint: "Easier to read" },
  xl: { label: "Extra large", value: 1.25, hint: "Maximum readability" },
};

export const THEME_KEY = "lincode.theme";
export const SCALE_KEY = "lincode.fontScale";

interface PreferencesValue {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
  fontScale: FontScale;
  setFontScale: (scale: FontScale) => void;
  increaseFont: () => void;
  decreaseFont: () => void;
}

const PreferencesContext = React.createContext<PreferencesValue | null>(null);

const SCALE_ORDER: FontScale[] = ["sm", "base", "lg", "xl"];

function applyTheme(theme: Theme): "light" | "dark" {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const resolved = theme === "system" ? (prefersDark ? "dark" : "light") : theme;
  document.documentElement.classList.toggle("dark", resolved === "dark");
  document.documentElement.style.colorScheme = resolved;
  return resolved;
}

function applyScale(scale: FontScale) {
  document.documentElement.style.setProperty("--font-scale", String(FONT_SCALES[scale].value));
  document.documentElement.dataset.fontScale = scale;
}

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = React.useState<"light" | "dark">("light");
  const [fontScale, setScaleState] = React.useState<FontScale>("base");

  // Hydrate from what the pre-paint script already applied.
  React.useEffect(() => {
    const storedTheme = (readStored(THEME_KEY) as Theme | null) ?? "system";
    const storedScale = (readStored(SCALE_KEY) as FontScale | null) ?? "base";
    setThemeState(storedTheme);
    setScaleState(SCALE_ORDER.includes(storedScale) ? storedScale : "base");
    setResolvedTheme(applyTheme(storedTheme));
    applyScale(SCALE_ORDER.includes(storedScale) ? storedScale : "base");
  }, []);

  // Follow the OS when the user has chosen "system".
  React.useEffect(() => {
    if (theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setResolvedTheme(applyTheme("system"));
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = React.useCallback((next: Theme) => {
    setThemeState(next);
    writeStored(THEME_KEY, next);
    setResolvedTheme(applyTheme(next));
  }, []);

  const setFontScale = React.useCallback((next: FontScale) => {
    setScaleState(next);
    writeStored(SCALE_KEY, next);
    applyScale(next);
  }, []);

  const step = React.useCallback(
    (direction: 1 | -1) => {
      setScaleState((current) => {
        const index = SCALE_ORDER.indexOf(current);
        const next = SCALE_ORDER[Math.min(SCALE_ORDER.length - 1, Math.max(0, index + direction))];
        writeStored(SCALE_KEY, next);
        applyScale(next);
        return next;
      });
    },
    [],
  );

  const value = React.useMemo<PreferencesValue>(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
      fontScale,
      setFontScale,
      increaseFont: () => step(1),
      decreaseFont: () => step(-1),
    }),
    [theme, resolvedTheme, setTheme, fontScale, setFontScale, step],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): PreferencesValue {
  const ctx = React.useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences must be used inside <PreferencesProvider>.");
  return ctx;
}

/**
 * Runs before first paint. Kept as a plain string so it can be inlined without
 * pulling React hydration into the critical path.
 */
export const PREFERENCES_BOOTSTRAP_SCRIPT = `
(function () {
  try {
    var t = localStorage.getItem('${THEME_KEY}') || 'system';
    var dark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    var s = localStorage.getItem('${SCALE_KEY}') || 'base';
    var map = { sm: 0.9, base: 1, lg: 1.125, xl: 1.25 };
    document.documentElement.style.setProperty('--font-scale', String(map[s] || 1));
    document.documentElement.dataset.fontScale = s;
  } catch (e) {}
})();
`.trim();
