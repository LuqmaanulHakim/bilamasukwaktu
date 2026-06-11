"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

export type AccentColor = "indigo" | "pink" | "rose" | "amber" | "emerald" | "sky" | "violet" | "orange";
export type Texture =
  | "plain"
  | "circle"
  | "wave"
  | "dot"
  | "zigzag"

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

export const TEXTURES: { id: Texture; label: string }[] = [
  { id: "plain",  label: "Plain"  },
  { id: "circle", label: "Circle" },
  { id: "wave",   label: "Wave"   },
  { id: "dot",    label: "Dot"    },
  { id: "zigzag", label: "Zigzag" },
];

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  accent: AccentColor;
  setAccent: (color: AccentColor) => void;
  showCountdown: boolean;
  toggleCountdown: () => void;
  texture: Texture;
  setTexture: (t: Texture) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  toggleTheme: () => {},
  accent: "indigo",
  setAccent: () => {},
  showCountdown: true,
  toggleCountdown: () => {},
  texture: "plain",
  setTexture: () => {},
});

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

function buildTextureUrl(texture: Texture, hex: string, isDark: boolean): string {
  const opacity = isDark ? "0.14" : "0.10";
  const rgb = hexToRgb(hex);
  const stroke = `rgba(${rgb},${opacity})`;
  const enc = encodeURIComponent;

  if (texture === "plain") return "none";

  if (texture === "circle") {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><circle cx="12" cy="12" r="5" fill="none" stroke="${stroke}" stroke-width="1.2"/></svg>`;
    return `url("data:image/svg+xml,${enc(svg)}")`;
  }

  if (texture === "wave") {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="16"><path d="M0 8 Q10 0 20 8 Q30 16 40 8" fill="none" stroke="${stroke}" stroke-width="1.2"/></svg>`;
    return `url("data:image/svg+xml,${enc(svg)}")`;
  }

  if (texture === "dot") {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20">
      <circle cx="10" cy="10" r="2" fill="${stroke}" />
    </svg>`;
    return `url("data:image/svg+xml,${enc(svg)}")`;
  }

  if (texture === "zigzag") {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="16">
      <path d="M0 12 L8 4 L16 12 L24 4 L32 12"
        fill="none"
        stroke="${stroke}"
        stroke-width="1.2"/>
    </svg>`;
    return `url("data:image/svg+xml,${enc(svg)}")`;
  }

  return "none";
}

function applyAccent(accent: AccentColor, theme: Theme) {
  const found = ACCENT_COLORS.find((c) => c.id === accent) ?? ACCENT_COLORS[0];
  const hex = theme === "dark" ? found.darkHex : found.hex;

  document.documentElement.style.setProperty("--accent", hex);
  document.documentElement.style.setProperty("--accent-subtle", hex + (theme === "dark" ? "22" : "18"));
  document.documentElement.style.setProperty("--accent-border", hex + (theme === "dark" ? "55" : "40"));

  if (theme === "dark") {
    document.documentElement.style.setProperty("--background-tint-start", `color-mix(in srgb, ${hex} 12%, #0f172a)`);
    document.documentElement.style.setProperty("--background-tint-end", `color-mix(in srgb, ${hex} 6%, #1e293b)`);
  } else {
    document.documentElement.style.setProperty("--background-tint-start", `color-mix(in srgb, ${hex} 15%, #dbeafe)`);
    document.documentElement.style.setProperty("--background-tint-end", `color-mix(in srgb, ${hex} 5%, #f8fafc)`);
  }
}

function applyTexture(texture: Texture, accent: AccentColor, theme: Theme) {
  const found = ACCENT_COLORS.find((c) => c.id === accent) ?? ACCENT_COLORS[0];
  const hex = theme === "dark" ? found.darkHex : found.hex;
  const url = buildTextureUrl(texture, hex, theme === "dark");
  document.documentElement.style.setProperty("--bg-texture", url);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [accent, setAccentState] = useState<AccentColor>("indigo");
  const [showCountdown, setShowCountdown] = useState<boolean>(true);
  const [texture, setTextureState] = useState<Texture>("plain");

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") as Theme | null;
    const storedAccent = localStorage.getItem("accent") as AccentColor | null;
    const storedCountdown = localStorage.getItem("showCountdown");
    const storedTexture  = localStorage.getItem("texture") as Texture | null;
    const preferred = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

    const initialTheme: Theme = storedTheme ?? preferred;
    const initialAccent: AccentColor = storedAccent ?? "indigo";
    const initialCountdown: boolean     = storedCountdown === null ? true : storedCountdown === "true";
    const initialTexture:   Texture     = storedTexture  ?? "plain";

    setTheme(initialTheme);
    setAccentState(initialAccent);
    setShowCountdown(initialCountdown);
    setTextureState(initialTexture);

    document.documentElement.setAttribute("data-theme", initialTheme);
    applyAccent(initialAccent, initialTheme);
    applyTexture(initialTexture, initialAccent, initialTheme);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem("theme", next);
      document.documentElement.setAttribute("data-theme", next);
      applyAccent(accent, next);
      applyTexture(texture, accent, next);
      return next;
    });
  };

  const setAccent = (color: AccentColor) => {
    setAccentState(color);
    localStorage.setItem("accent", color);
    applyAccent(color, theme);
    applyTexture(texture, color, theme);
  };

  const toggleCountdown = () => {
    setShowCountdown((prev) => {
      const next = !prev;
      localStorage.setItem("showCountdown", String(next));
      return next;
    });
  };

  const setTexture = (t: Texture) => {
    setTextureState(t);
    localStorage.setItem("texture", t);
    applyTexture(t, accent, theme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, accent, setAccent, showCountdown, toggleCountdown, texture, setTexture }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}