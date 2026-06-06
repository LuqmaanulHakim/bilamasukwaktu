"use client";

import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { useWaktuSolatWeek } from "../hooks/useWaktuSolatWeek";

type Props = { zone: string };

const PRAYERS = [
  { key: "fajr",    label: "Subuh"   },
  { key: "syuruk",  label: "Syuruk"  },
  { key: "dhuhr",   label: "Zohor"   },
  { key: "asr",     label: "Asar"    },
  { key: "maghrib", label: "Maghrib" },
  { key: "isha",    label: "Isha"    },
] as const;

const DAY_MY: Record<string, string> = {
  Monday: "Isnin", Tuesday: "Selasa", Wednesday: "Rabu",
  Thursday: "Khamis", Friday: "Jumaat", Saturday: "Sabtu", Sunday: "Ahad",
};

const MONTH_MY: Record<string, string> = {
  Jan: "Jan", Feb: "Feb", Mar: "Mac",  Apr: "Apr",
  May: "Mei", Jun: "Jun", Jul: "Jul",  Aug: "Ogos",
  Sep: "Sep", Oct: "Okt", Nov: "Nov",  Dec: "Dis",
};

function formatMalayDate(dateStr?: string): { day: string; month: string; year: string } {
  if (!dateStr) return { day: "--", month: "", year: "" };
  const [d, m, y] = dateStr.split("-");
  return { day: d, month: MONTH_MY[m] ?? m, year: y };
}

function parseTimeToDate(timeStr: string, ref: Date, dayOffset = 0): Date {
  const [h, m] = timeStr.split(":").map(Number);
  const d = new Date(ref);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(h, m, 0, 0);
  return d;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "Sekarang";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}j ${m}m ${sec}s`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

function msUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime() - now.getTime();
}

export default function PrayerTimesGrid({ zone }: Props) {
  const { theme, showCountdown } = useTheme();
  const isDark = theme === "dark";

  const { week, error } = useWaktuSolatWeek(zone);
  const [index, setIndex]   = useState(0);
  const [now, setNow]       = useState(new Date());

  // Live clock
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Midnight auto-reset
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(() => { setIndex(0); schedule(); }, msUntilMidnight());
    };
    schedule();
    return () => clearTimeout(timer);
  }, []);

  const displayed = week[index] ?? null;
  const tomorrow  = week[index + 1] ?? null;

  const nextPrayer = displayed
    ? PRAYERS.find(p => parseTimeToDate(displayed[p.key], now) > now) ?? null
    : null;

  const nextPrayerTomorrow =
    !nextPrayer && tomorrow
      ? { label: "Subuh", time: tomorrow.fajr, offset: 1 }
      : null;

  const next = nextPrayer
    ? { label: nextPrayer.label, time: displayed![nextPrayer.key], offset: 0 }
    : nextPrayerTomorrow;

  const countdownMs = next
    ? parseTimeToDate(next.time, now, next.offset).getTime() - now.getTime()
    : 0;

  const { day, month } = formatMalayDate(displayed?.date);
  const dayLabel = index === 0
    ? "Hari ini"
    : DAY_MY[displayed?.day ?? ""] ?? displayed?.day ?? "";

  const activePillBg     = "color-mix(in srgb, var(--accent) 12%, transparent)";
  const activePillBorder = "color-mix(in srgb, var(--accent) 35%, transparent)";
  const pillBg           = isDark ? "rgba(51,65,85,0.45)" : "rgba(0,0,0,0.04)";
  const pillBorder       = isDark ? "rgba(71,85,105,0.3)" : "rgba(0,0,0,0.07)";
  const cardBg           = isDark ? "rgba(15,23,42,0.85)" : "#ffffff";
  const cardBorder       = isDark ? "rgba(71,85,105,0.35)" : "rgba(0,0,0,0.08)";

  if (error) {
    return (
      <p className="text-center text-sm py-4" style={{ color: "var(--muted)" }}>
        {error}
      </p>
    );
  }

  return (
    <section
      style={{
        background:   cardBg,
        border:       `0.5px solid ${cardBorder}`,
        borderRadius: "20px",
        overflow:     "hidden",
      }}
    >
      {/* ── Header ───────────────────────────────────────── */}
      <div style={{ padding: "1.25rem 1.25rem 1.1rem" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.9rem" }}>

          {/* Date */}
          <div>
            <p style={{ fontSize: 20, fontWeight: 400, color: "var(--foreground)", letterSpacing: "-0.02em", lineHeight: 1.15 }}>
              {day} {month}
            </p>
            <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
              {dayLabel}
            </p>
          </div>

          {/* Nav + badge */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
            {/* Prev / Next */}
            <div style={{ display: "flex", gap: 4 }}>
              {(["prev", "next"] as const).map(dir => {
                const disabled = dir === "prev" ? index === 0 : index === week.length - 1;
                return (
                  <button
                    key={dir}
                    onClick={() => setIndex(i => dir === "prev" ? Math.max(0, i - 1) : Math.min(week.length - 1, i + 1))}
                    disabled={disabled}
                    aria-label={dir === "prev" ? "Hari sebelum" : "Hari berikut"}
                    style={{
                      width:          26, height: 26,
                      borderRadius:   "50%",
                      border:         `0.5px solid ${isDark ? "rgba(71,85,105,0.5)" : "rgba(0,0,0,0.12)"}`,
                      background:     "transparent",
                      cursor:         disabled ? "default" : "pointer",
                      opacity:        disabled ? 0.2 : 1,
                      color:          "var(--foreground)",
                      fontSize:       14,
                      display:        "flex",
                      alignItems:     "center",
                      justifyContent: "center",
                      lineHeight:     1,
                      transition:     "opacity 0.15s",
                    }}
                  >
                    {dir === "prev" ? "‹" : "›"}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Pill grid ──────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
          {PRAYERS.map(({ key, label }) => {
            const timeStr  = displayed?.[key] ?? null;
            const isPast   = index === 0 && timeStr ? parseTimeToDate(timeStr, now) < now : false;
            const isActive = index === 0 && next?.label === label;

            return (
              <div
                key={key}
                style={{
                  borderRadius: 12,
                  padding:      "9px 10px 8px",
                  background:   isActive ? activePillBg   : pillBg,
                  border:       `0.5px solid ${isActive ? activePillBorder : pillBorder}`,
                  opacity:      isPast ? 0.35 : 1,
                  transition:   "background 0.3s, border-color 0.3s, opacity 0.3s",
                }}
              >
                {/* Label */}
                <p style={{
                  fontSize:      9,
                  fontWeight:    500,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color:         isActive ? "var(--accent)" : "var(--muted)",
                  marginBottom:  4,
                  transition:    "color 0.3s",
                }}>
                  {label}
                </p>
                {/* Time */}
                <p style={{
                  fontSize:           15,
                  fontWeight:         isActive ? 500 : 400,
                  fontVariantNumeric: "tabular-nums",
                  letterSpacing:      "-0.01em",
                  color:              isActive ? "var(--accent)" : "var(--foreground)",
                  transition:         "color 0.3s",
                }}>
                  {timeStr?.slice(0, 5) ?? "--:--"}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{
        display:        "flex",
        justifyContent: "center",
        gap:            5,
        padding:        "0 1.25rem 1rem",
        paddingTop:     showCountdown && next ? "0.6rem" : "0"
      }}>
        {week.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={`Hari ${i + 1}`}
            style={{
              height:       3,
              width:        i === index ? 16 : 4,
              borderRadius: 2,
              border:       "none",
              cursor:       "pointer",
              padding:      0,
              background:   i === index
                ? "var(--accent)"
                : isDark ? "rgba(71,85,105,0.4)" : "rgba(0,0,0,0.12)",
              transition:   "all 0.2s ease",
            }}
          />
        ))}
      </div>
    </section>
  );
}