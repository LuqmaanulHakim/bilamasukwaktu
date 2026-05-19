"use client";

import PrayerTimesGrid from "./components/PrayerTimesGrid";
import SunTimeline from "./components/SunTimeline";
import { useZones } from "./hooks/useZones";
import { useWaktuSolatWeek } from "./hooks/useWaktuSolatWeek";
import { useSelectedZone } from "./hooks/useSelectedZone";
import { useTheme } from "./context/ThemeContext";
import IslamicDashboardCard from "./components/DashboardCard";

const getMalayDate = (date: Date) => {
  return date.toLocaleDateString("ms-MY", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const HeroSkeleton = () => (
  <section
    className="text-white rounded-3xl p-6 shadow-xl"
    style={{ background: "linear-gradient(to bottom right, var(--accent), var(--accent)dd)" }}
  >
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
  const { week, error } = useWaktuSolatWeek(zone);

  const today = week[0] ?? null;
  const tomorrow = week[1] ?? null;

  const dailyZikir: Record<string, string> = {
    Isnin:
      "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ الْعَلِيِّ الْعَظِيم",
    Selasa:
      "اللَّهُمَّ صَلِّ عَلَى عَبْدِكَ وَرَسُولِكَ وَنَبِيِّكَ الأَمِينِ وَعَلَى آلِهِ وَصَحْبِهِ وَسَلِّمْ",
    Rabu:
      "اَسْتَغْفِرُاللهَ الْعَظِيْمَ",
    Khamis:
      "سُبْحَانَ اللَّهِ العَظِيم سُبْحَانَ اللَّهِ وَبِحَمْدِهِ",
    Jumaat:
      "يَا اللّٰهُ",
    Sabtu:
      "لَا إِلَٰهَ إِلَّا ٱللَّٰهُ",
    Ahad:
      "يَا حَيُّ يَا قَيُّومُ",
  };

  const getCurrentMalayDay = (override?: string) => {
  if (override) return override;

  return new Date().toLocaleDateString("ms-MY", {
    weekday: "long",
  });
};

const currentDay = getCurrentMalayDay("Selasa"); // debug
const zikirText = dailyZikir[currentDay];

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
        <div
          className="rounded-2xl p-6 text-center border"
          style={{
            background: "var(--accent-subtle)",
            borderColor: "var(--accent-border)",
          }}
        >
          <p style={{ color: "var(--accent)" }}>Error loading prayer times</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 text-white rounded-lg text-sm"
            style={{ background: "var(--accent)" }}
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  if (!today) {
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
      <IslamicDashboardCard
        selectedZone={selectedZone}
        zikirText={zikirText}
        getMalayDate={getMalayDate}
      />

      {/* TIMELINE */}
      <SunTimeline data={today} tomorrow={tomorrow} />

      {/* PRAYER TIMES */}
      <PrayerTimesGrid zone={zone} />
    </main>
  );
}