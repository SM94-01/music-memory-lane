import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Theme = "default" | "light" | "mono";
const KEY = "trax.theme";

const ThemeCtx = createContext<{ theme: Theme; setTheme: (t: Theme) => void }>({
  theme: "default",
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("default");

  useEffect(() => {
    const stored = (typeof window !== "undefined" && (localStorage.getItem(KEY) as Theme)) || "default";
    setThemeState(stored);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.classList.remove("theme-default", "theme-light", "theme-mono");
    root.classList.add(`theme-${theme}`);
  }, [theme]);

  function setTheme(t: Theme) {
    localStorage.setItem(KEY, t);
    setThemeState(t);
  }

  return <ThemeCtx.Provider value={{ theme, setTheme }}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  return useContext(ThemeCtx);
}

export const THEMES: { key: Theme; label: string; swatch: string[] }[] = [
  { key: "default", label: "Vinyl Blue", swatch: ["#1f4d6e", "#ffffff", "#e63946"] },
  { key: "light", label: "Paper", swatch: ["#ffffff", "#1f4d6e", "#e63946"] },
  { key: "mono", label: "Midnight", swatch: ["#000000", "#ffffff", "#e63946"] },
];
