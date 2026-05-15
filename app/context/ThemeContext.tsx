"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

export type AccentColor = "indigo" | "pink" | "rose" | "amber" | "emerald" | "sky" | "violet" | "orange";

export const ACCENT_COLORS: { id: AccentColor; label: string; hex: string; darkHex: string }[] = [
  { id: "indigo",  label: "Indigo",  hex: "#6366f1", darkHex: "#818cf8" },
  { id: "pink",    label: "Pink",    hex: "#ec4899", darkHex: "#f472b6" },
  { id: "rose",    label: "Rose",    hex: "#f43f5e", darkHex: "#fb7185" },
  { id: "amber",   label: "Amber",   hex: "#f59e0b", darkHex: "#fbbf24" },
  { id: "emerald", label: "Hijau",   hex: "#10b981", darkHex: "#34d399" },
  { id: "sky",     label: "Biru",    hex: "#0ea5e9", darkHex: "#38bdf8" },
  { id: "violet",  label: "Violet",  hex: "#8b5cf6", darkHex: "#a78bfa" },
  { id: "orange",  label: "Oren",    hex: "#f97316", darkHex: "#fb923c" },
];

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  accent: AccentColor;
  setAccent: (color: AccentColor) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  toggleTheme: () => {},
  accent: "indigo",
  setAccent: () => {},
});

function applyAccent(accent: AccentColor, theme: Theme) {
  const found = ACCENT_COLORS.find((c) => c.id === accent) ?? ACCENT_COLORS[0];
  const hex = theme === "dark" ? found.darkHex : found.hex;

  document.documentElement.style.setProperty("--accent", hex);
  document.documentElement.style.setProperty("--accent-subtle", hex + (theme === "dark" ? "22" : "18"));
  document.documentElement.style.setProperty("--accent-border", hex + (theme === "dark" ? "55" : "40"));

  if (theme === "dark") {
    document.documentElement.style.setProperty(
      "--background-tint-start",
      `color-mix(in srgb, ${hex} 12%, #0f172a)`
    );
    document.documentElement.style.setProperty(
      "--background-tint-end",
      `color-mix(in srgb, ${hex} 6%, #1e293b)`
    );
  } else {
    document.documentElement.style.setProperty(
      "--background-tint-start",
      `color-mix(in srgb, ${hex} 15%, #dbeafe)`
    );
    document.documentElement.style.setProperty(
      "--background-tint-end",
      `color-mix(in srgb, ${hex} 5%, #f8fafc)`
    );
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [accent, setAccentState] = useState<AccentColor>("indigo");

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") as Theme | null;
    const storedAccent = localStorage.getItem("accent") as AccentColor | null;
    const preferred = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const initialTheme = storedTheme ?? preferred;
    const initialAccent: AccentColor = storedAccent ?? "indigo";

    setTheme(initialTheme);
    setAccentState(initialAccent);
    document.documentElement.setAttribute("data-theme", initialTheme);
    applyAccent(initialAccent, initialTheme);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem("theme", next);
      document.documentElement.setAttribute("data-theme", next);
      applyAccent(accent, next);
      return next;
    });
  };

  const setAccent = (color: AccentColor) => {
    setAccentState(color);
    localStorage.setItem("accent", color);
    applyAccent(color, theme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, accent, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}