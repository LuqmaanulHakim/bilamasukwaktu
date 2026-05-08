"use client";

import ZoneSelector from "../components/ZoneSelector";
import { useZones } from "../hooks/useZones";
import { useSelectedZone } from "../hooks/useSelectedZone";
import { useTheme } from "../context/ThemeContext";
import { Moon, Sun } from "lucide-react";

export default function SettingsPage() {
  const { zones, loading: zonesLoading } = useZones();
  const { zone, setZone } = useSelectedZone();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <main className="w-full max-w-md mx-auto min-h-screen px-4 py-4 pb-24 space-y-5">
      {/* HEADER */}
      <section className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-3xl p-6 shadow-xl">
        <h1 className="text-2xl font-bold mt-1">Tetapan</h1>
        <p className="mt-1 text-sm opacity-80">Sesuaikan mengikut tetapan anda</p>
      </section>

      {/* ZONE SELECTOR */}
      <section
        className="rounded-2xl shadow-sm border p-5 space-y-3"
        style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
      >
        <div className="flex items-center gap-2 mb-1">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: isDark ? "#1e3a5f" : "#eef2ff" }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              className="w-4 h-4 text-indigo-500"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
              Zon Kawasan
            </p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              Pilih zon anda
            </p>
          </div>
        </div>

        {zonesLoading ? (
          <div className="relative w-full">
            {/* Skeleton button */}
            <div className="w-full px-4 py-3 rounded-2xl flex items-center justify-between shadow-sm border">
              <div className="flex flex-col items-start gap-1">
                <div className="h-4 w-24 rounded animate-pulse" style={{ background: "var(--card-border)" }} />
                <div className="h-3 w-32 rounded animate-pulse" style={{ background: "var(--card-border)" }} />
              </div>
              <div className="h-3 w-3 rounded animate-pulse" style={{ background: "var(--card-border)" }} />
            </div>
          </div>
        ) : (
          <ZoneSelector zones={zones} value={zone} onChange={setZone} />
        )}
      </section>

      {/* APPEARANCE */}
      <section
        className="rounded-2xl shadow-sm border p-5"
        style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: isDark ? "#1e3a5f" : "#eef2ff" }}
          >
            {isDark ? (
              <Moon size={16} className="text-indigo-400" />
            ) : (
              <Sun size={16} className="text-indigo-500" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
              Mod tatapan
            </p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              Pilih antara mod gelap atau terang
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
              Dark Mode
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
              {isDark ? "On — easy on the eyes" : "Off — using light theme"}
            </p>
          </div>

          <button
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            className="relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            style={{ background: isDark ? "#3b82f6" : "var(--card-border)" }}
          >
            <span
              className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300"
              style={{ transform: isDark ? "translateX(24px)" : "translateX(0)" }}
            />
          </button>
        </div>
      </section>
    </main>
  );
}