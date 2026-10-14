"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";
type ResolvedTheme = "dark" | "light";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  /** What the student chose (may be "system") */
  theme: Theme;
  /** What is actually on screen. Toggles must use this: "system" can mean either. */
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: "system",
  resolvedTheme: "light",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

const systemPrefersDark = () => typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;

/** Browser chrome (status bar, address bar) follows the app's theme, not just the OS */
const THEME_COLOR: Record<ResolvedTheme, string> = { light: "#ffffff", dark: "#111827" };

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "umis-theme",
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [systemDark, setSystemDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // localStorage and the OS setting only exist in the browser, after hydration
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    setSystemDark(systemPrefersDark());
    const storedTheme = localStorage.getItem(storageKey) as Theme;
    if (storedTheme) {
      setTheme(storedTheme);
    }
  }, [storageKey]);

  // "System" follows the OS live (e.g. a phone switching to dark at sunset)
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystemDark(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const resolvedTheme: ResolvedTheme = theme === "system" ? (systemDark ? "dark" : "light") : theme;

  useEffect(() => {
    if (!mounted) return;
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(resolvedTheme);
    // Declaring the scheme matters: without it, phone browsers with forced dark mode
    // (Chrome auto-dark, Samsung Internet) darken the page, maps included, even in light mode.
    root.style.colorScheme = resolvedTheme;
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
      m.setAttribute("content", THEME_COLOR[resolvedTheme]);
      m.removeAttribute("media");
    });
  }, [resolvedTheme, mounted]);

  const value = {
    theme,
    resolvedTheme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
  };

  // To avoid hydration mismatch, we still render children but without the context if not mounted yet
  // However, it's safe to provide context immediately with initial theme
  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};
