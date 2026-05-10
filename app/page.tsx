"use client";

import PrayerTimesGrid from "./components/PrayerTimesGrid";
import SunTimeline from "./components/SunTimeline";
import { useZones } from "./hooks/useZones";
import { useWaktuSolat } from "./hooks/useWaktuSolat";
import { useSelectedZone } from "./hooks/useSelectedZone";
import { useTheme } from "./context/ThemeContext";

const getMalayDate = (date: Date) => {
  return date.toLocaleDateString("ms-MY", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const HeroSkeleton = () => (
  <section className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-3xl p-6 shadow-xl">
    <div className="animate-pulse">
      <div className="h-3 w-24 bg-white/30 rounded mb-2"></div>
      <div className="h-8 w-40 bg-white/30 rounded mt-1"></div>
      <div className="h-4 w-32 bg-white/30 rounded mt-1"></div>
      <div className="h-4 w-48 bg-white/30 rounded mt-2"></div>
    </div>
  </section>
);

const SunTimelineSkeleton = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div
      className="rounded-3xl p-6 shadow-sm border animate-pulse"
      style={{
        background: "var(--card-bg)",
        borderColor: "var(--card-border)",
      }}
    >
      <div className="mb-4">
        <div className="h-3 w-24 rounded" style={{ background: isDark ? "#334155" : "#e2e8f0" }}></div>
        <div className="h-6 w-32 rounded mt-1" style={{ background: isDark ? "#475569" : "#cbd5e1" }}></div>
      </div>
      <div className="w-full flex justify-center">
        <div className="w-[320px] h-[200px] rounded-lg" style={{ background: isDark ? "#1e293b" : "#f8fafc" }}></div>
      </div>
      <div className="flex justify-between mt-3">
        <div>
          <div className="h-3 w-12 rounded mb-1" style={{ background: isDark ? "#334155" : "#e2e8f0" }}></div>
          <div className="h-5 w-16 rounded" style={{ background: isDark ? "#475569" : "#cbd5e1" }}></div>
        </div>
        <div className="text-right">
          <div className="h-3 w-12 rounded mb-1 ml-auto" style={{ background: isDark ? "#334155" : "#e2e8f0" }}></div>
          <div className="h-5 w-16 rounded ml-auto" style={{ background: isDark ? "#475569" : "#cbd5e1" }}></div>
        </div>
      </div>
    </div>
  );
};

const PrayerTimesGridSkeleton = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div
      className="backdrop-blur-lg rounded-3xl border shadow p-2 animate-pulse"
      style={{
        background: isDark ? "rgba(30,41,59,0.7)" : "rgba(255,255,255,0.7)",
        borderColor: isDark ? "rgba(51,65,85,0.5)" : "rgba(255,255,255,0.5)",
      }}
    >
      <div className="grid grid-cols-3 gap-4 text-center">
        {["Subuh", "Syuruk", "Zohor", "Asar", "Maghrib", "Isha"].map((name, index) => (
          <div
            key={index}
            className="rounded-2xl py-3"
            style={{
              background: isDark ? "rgba(51,65,85,0.4)" : "rgba(255,255,255,0.4)",
            }}
          >
            <div className="h-4 w-16 rounded mx-auto" style={{ background: isDark ? "#334155" : "#e2e8f0" }}></div>
            <div className="h-6 w-20 rounded mx-auto mt-2" style={{ background: isDark ? "#475569" : "#cbd5e1" }}></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function Home() {
  const { zones, loading: zonesLoading } = useZones();
  const { zone } = useSelectedZone();
  const { data, error } = useWaktuSolat(zone); // still used by SunTimeline only

  if (zonesLoading) {
    return (
      <main className="w-full max-w-md mx-auto min-h-screen px-4 py-4 pb-24 space-y-5">
        <HeroSkeleton />
        <SunTimelineSkeleton />
        <PrayerTimesGridSkeleton />
      </main>
    );
  }

  if (error) {
    return (
      <main className="w-full max-w-md mx-auto min-h-screen px-4 py-4">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-600">Error loading prayer times</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="w-full max-w-md mx-auto min-h-screen px-4 py-4 pb-24 space-y-5">
        <HeroSkeleton />
        <SunTimelineSkeleton />
        <PrayerTimesGridSkeleton />
      </main>
    );
  }

  const selectedZone = zones.find((z: any) => z.jakimCode === zone);

  return (
    <main className="w-full max-w-md mx-auto min-h-screen px-4 py-4 pb-24 space-y-5">
      {/* HERO */}
      <section className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-3xl p-6 shadow-xl">
        <p className="text-sm opacity-80">Waktu Solat bagi</p>
        <h1 className="text-2xl font-bold mt-1">{selectedZone?.negeri}</h1>
        <p className="mt-1 text-sm opacity-80">
          {selectedZone?.daerah || "Prayer Times"}
        </p>
        <p className="mt-2 opacity-90 text-sm">
          {getMalayDate(new Date())}
        </p>
      </section>

      {/* TIMELINE */}
      <SunTimeline data={data as any} />

      {/* PRAYER TIMES */}
      <PrayerTimesGrid zone={zone} />
    </main>
  );
}