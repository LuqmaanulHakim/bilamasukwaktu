"use client";

import { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { useWaktuSolatWeek } from "../hooks/useWaktuSolatWeek";

type Props = {
  zone: string;
};

const PRAYERS = [
  { key: "fajr", label: "Subuh" },
  { key: "syuruk", label: "Syuruk" },
  { key: "dhuhr", label: "Zohor" },
  { key: "asr", label: "Asar" },
  { key: "maghrib", label: "Maghrib" },
  { key: "isha", label: "Isha" },
] as const;

/* =========================
   Malay Day & Month Convert
========================= */

const DAY_MY: Record<string, string> = {
  Monday: "Isnin",
  Tuesday: "Selasa",
  Wednesday: "Rabu",
  Thursday: "Khamis",
  Friday: "Jumaat",
  Saturday: "Sabtu",
  Sunday: "Ahad",
};

const MONTH_MY: Record<string, string> = {
  Jan: "Januari",
  Feb: "Februari",
  Mar: "Mac",
  Apr: "April",
  May: "Mei",
  Jun: "Jun",
  Jul: "Julai",
  Aug: "Ogos",
  Sep: "September",
  Oct: "Oktober",
  Nov: "November",
  Dec: "Disember",
};

function formatMalayDate(dateStr?: string) {
  if (!dateStr) return "--";

  const [day, month, year] = dateStr.split("-");

  return `${day} ${MONTH_MY[month] ?? month} ${year}`;
}

export default function PrayerTimesGrid({ zone }: Props) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const { week, error } = useWaktuSolatWeek(zone);
  const [index, setIndex] = useState(0);

  const displayed = week[index] ?? null;

  const handlePrev = () => setIndex((i) => Math.max(0, i - 1));

  const handleNext = () =>
    setIndex((i) => Math.min(week.length - 1, i + 1));

  if (error) {
    return (
      <p
        className="text-center text-sm"
        style={{ color: "var(--muted)" }}
      >
        {error}
      </p>
    );
  }

  return (
    <section
      className="backdrop-blur-lg rounded-3xl border shadow p-4"
      style={{
        background: isDark
          ? "rgba(30,41,59,0.7)"
          : "rgba(255,255,255,0.7)",
        borderColor: isDark
          ? "rgba(51,65,85,0.5)"
          : "rgba(255,255,255,0.5)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        {/* Left */}
        <div>
          <p
            className="text-xs font-medium tracking-wide"
            style={{ color: "var(--muted)" }}
          >
            {index === 0
              ? "Hari Ini"
              : DAY_MY[displayed?.day ?? ""] ?? displayed?.day}
          </p>

          <p
            className="text-base font-semibold mt-0.5"
            style={{ color: "var(--foreground)" }}
          >
            {formatMalayDate(displayed?.date)}
          </p>
        </div>

        {/* Right */}
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrev}
            disabled={index === 0}
            className="w-8 h-8 flex items-center justify-center rounded-xl transition-all"
            style={{
              background: isDark
                ? "rgba(51,65,85,0.5)"
                : "rgba(0,0,0,0.06)",
              color:
                index === 0
                  ? isDark
                    ? "rgba(255,255,255,0.2)"
                    : "rgba(0,0,0,0.2)"
                  : "var(--foreground)",
            }}
          >
            ‹
          </button>

          <button
            onClick={handleNext}
            disabled={index === week.length - 1}
            className="w-8 h-8 flex items-center justify-center rounded-xl transition-all"
            style={{
              background: isDark
                ? "rgba(51,65,85,0.5)"
                : "rgba(0,0,0,0.06)",
              color:
                index === week.length - 1
                  ? isDark
                    ? "rgba(255,255,255,0.2)"
                    : "rgba(0,0,0,0.2)"
                  : "var(--foreground)",
            }}
          >
            ›
          </button>
        </div>
      </div>

      {/* Prayer Times */}
      <div className="grid grid-cols-3 gap-3 text-center">
        {PRAYERS.map(({ key, label }) => (
          <div
            key={key}
            className="rounded-2xl py-3"
            style={{
              background: isDark
                ? "rgba(51,65,85,0.4)"
                : "rgba(255,255,255,0.4)",
            }}
          >
            <p
              className="text-xs"
              style={{ color: "var(--muted)" }}
            >
              {label}
            </p>

            <p
              className="font-semibold text-base mt-1"
              style={{ color: "var(--foreground)" }}
            >
              {displayed?.[key]?.slice(0, 5) ?? "--:--"}
            </p>
          </div>
        ))}
      </div>

      {/* Dot Indicators */}
      <div className="flex justify-center gap-1.5 mt-4">
        {week.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className="rounded-full transition-all duration-200"
            style={{
              width: i === index ? "16px" : "6px",
              height: "6px",
              background:
                i === index
                  ? "var(--accent)"
                  : isDark
                  ? "rgba(255,255,255,0.2)"
                  : "rgba(0,0,0,0.15)",
            }}
          />
        ))}
      </div>
    </section>
  );
}