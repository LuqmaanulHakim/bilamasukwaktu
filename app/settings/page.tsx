"use client";

import ZoneSelector from "../components/ZoneSelector";
import { useZones } from "../hooks/useZones";
import { useSelectedZone } from "../hooks/useSelectedZone";
import { useGpsZone } from "../hooks/useGpsZone";
import { useTheme } from "../context/ThemeContext";
import { Moon, Sun, LocateFixed, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function SettingsPage() {
  const { zones, loading: zonesLoading } = useZones();
  const { zone, setZone } = useSelectedZone();
  const { theme, toggleTheme } = useTheme();
  const { status: gpsStatus, error: gpsError, detected, locate } = useGpsZone();
  const isDark = theme === "dark";

  const isLocating = gpsStatus === "locating";
  const isSuccess = gpsStatus === "success";
  const isError = gpsStatus === "error";

  return (
    <main className="w-full max-w-md mx-auto min-h-screen px-4 py-4 pb-24 space-y-5">
      {/* HEADER */}
      <section>
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
          <div className="flex-1">
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

        {/* GPS error detail */}
        {isError && gpsError && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
            style={{
              background: isDark ? "#2d0a0a" : "#fff1f2",
              color: isDark ? "#fca5a5" : "#be123c",
              border: "1px solid",
              borderColor: isDark ? "#7f1d1d" : "#fecdd3",
            }}
          >
            <AlertCircle size={13} className="shrink-0" />
            <span>{gpsError}</span>
          </div>
        )}

        {/* GPS success detail */}
        {isSuccess && detected && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
            style={{
              background: isDark ? "#052e16" : "#f0fdf4",
              color: isDark ? "#86efac" : "#166534",
              border: "1px solid",
              borderColor: isDark ? "#14532d" : "#bbf7d0",
            }}
          >
            <CheckCircle2 size={13} className="shrink-0" />
            <span>
              Zon dikesan: <strong>{detected.zone}</strong> — {detected.district}, {detected.state}
            </span>
          </div>
        )}
        
        {/* GPS BUTTON */}
        <button
            onClick={() => locate(setZone)}
            disabled={isLocating}
            aria-label="Kesan lokasi GPS"
            title="Kesan zon melalui GPS"
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: isSuccess
                ? isDark ? "#14532d" : "#dcfce7"
                : isError
                ? isDark ? "#450a0a" : "#fee2e2"
                : isDark ? "#1e3a5f" : "#eef2ff",
              color: isSuccess
                ? isDark ? "#86efac" : "#15803d"
                : isError
                ? isDark ? "#fca5a5" : "#dc2626"
                : isDark ? "#93c5fd" : "#4338ca",
              border: "1px solid",
              borderColor: isSuccess
                ? isDark ? "#166534" : "#bbf7d0"
                : isError
                ? isDark ? "#7f1d1d" : "#fecaca"
                : "transparent",
            }}
          >
            {isLocating ? (
              <Loader2 size={13} className="animate-spin" />
            ) : isSuccess ? (
              <CheckCircle2 size={13} />
            ) : isError ? (
              <AlertCircle size={13} />
            ) : (
              <LocateFixed size={13} />
            )}
            <span>
              {isLocating ? "Mencari" : isSuccess ? "Jumpa" : isError ? "Gagal" : "GPS"}
            </span>

            {/* Pulse ring while locating */}
            {isLocating && (
              <span
                className="absolute inset-0 rounded-xl animate-ping opacity-20"
                style={{ background: isDark ? "#93c5fd" : "#4338ca" }}
              />
            )}
          </button>
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
              Mod Tatapan
            </p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              Pilih antara mod gelap atau terang
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
              Mod Gelap
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
              {isDark ? "Buka" : "Tutup"}
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