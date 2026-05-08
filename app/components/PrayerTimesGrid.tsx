"use client";

import { useTheme } from "../context/ThemeContext";

type Props = {
  data: any;
};

export default function PrayerTimesGrid({ data }: Props) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const prayers = [
    { name: "Subuh",   time: data.fajr },
    { name: "Syuruk",  time: data.syuruk },
    { name: "Zohor",   time: data.dhuhr },
    { name: "Asar",    time: data.asr },
    { name: "Maghrib", time: data.maghrib },
    { name: "Isha",    time: data.isha },
  ];

  return (
    <section
      className="backdrop-blur-lg rounded-3xl border shadow p-2"
      style={{
        background: isDark ? "rgba(30,41,59,0.7)" : "rgba(255,255,255,0.7)",
        borderColor: isDark ? "rgba(51,65,85,0.5)" : "rgba(255,255,255,0.5)",
      }}
    >
      <div className="grid grid-cols-3 gap-4 text-center">
        {prayers.map((prayer) => (
          <div
            key={prayer.name}
            className="rounded-2xl py-3"
            style={{
              background: isDark ? "rgba(51,65,85,0.4)" : "rgba(255,255,255,0.4)",
            }}
          >
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              {prayer.name}
            </p>
            <p className="font-semibold text-lg mt-1" style={{ color: "var(--foreground)" }}>
              {prayer.time?.slice(0, 5)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}