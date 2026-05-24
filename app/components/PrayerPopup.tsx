"use client";

import { useEffect, useRef, useState } from "react";
import { usePrayerNotif, PrayerName } from "../context/PrayerNotifContext";
import { useTheme } from "../context/ThemeContext";
import { IconX, IconMoon, IconSunrise, IconSun, IconCloud, IconSunset, IconMoonStars } from "@tabler/icons-react";

const POPUP_WINDOW_MS = 15 * 1000;

const PRAYER_META: Record<PrayerName, { arabic: string; icon: React.ReactNode; reminder: string }> = {
  Subuh:   { arabic: "الفجر",  icon: <IconMoon      size={18} stroke={1.5} />, reminder: "Mulakan hari dengan rahmat-Nya." },
  Syuruk:  { arabic: "الشروق", icon: <IconSunrise   size={18} stroke={1.5} />, reminder: "Masa mustajab untuk berdoa." },
  Zohor:   { arabic: "الظهر",  icon: <IconSun       size={18} stroke={1.5} />, reminder: "Rehat sebentar, ingati Allah." },
  Asar:    { arabic: "العصر",  icon: <IconCloud     size={18} stroke={1.5} />, reminder: "Jangan lewatkan solat Asar." },
  Maghrib: { arabic: "المغرب", icon: <IconSunset    size={18} stroke={1.5} />, reminder: "Sambut malam dengan solat." },
  Isya:    { arabic: "العشاء", icon: <IconMoonStars size={18} stroke={1.5} />, reminder: "Tutup hari dengan solat Isya." },
};

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

export default function PrayerPopup() {
  const { activePrayer, dismissPrayer } = usePrayerNotif();
  const { theme, showPrayerPopup } = useTheme();
  const isDark = theme === "dark";

  const [visible, setVisible]     = useState(false);
  const [rendered, setRendered]   = useState(false);
  const [leaving, setLeaving]     = useState(false);
  // Controls the progress bar width via CSS transition
  const [barWidth, setBarWidth]   = useState("100%");
  const [barDuration, setBarDuration] = useState("0ms");
  const prevNameRef = useRef<PrayerName | null>(null);

  useEffect(() => {
    if (activePrayer) {
      if (prevNameRef.current !== activePrayer.name) {
        prevNameRef.current = activePrayer.name;
        setLeaving(false);
        setRendered(true);

        // How much of the 10-min window is already gone
        const [h, m] = activePrayer.time.split(":").map(Number);
        const prayerStart = new Date();
        prayerStart.setHours(h, m, 0, 0);
        const elapsed = Date.now() - prayerStart.getTime();
        const remaining = Math.max(POPUP_WINDOW_MS - elapsed, 0);
        const startWidth = `${(remaining / POPUP_WINDOW_MS) * 100}%`;

        // Start bar at current remaining width, no transition yet
        setBarWidth(startWidth);
        setBarDuration("0ms");

        requestAnimationFrame(() => requestAnimationFrame(() => {
          setVisible(true);
          // Now animate bar down to 0 over exactly the remaining time
          setBarWidth("0%");
          setBarDuration(`${remaining}ms`);
        }));
      }
    } else {
      handleLeave();
    }
  }, [activePrayer]);

  function handleLeave() {
    setLeaving(true);
    setVisible(false);
    setTimeout(() => { setRendered(false); setLeaving(false); }, 400);
  }

  function handleDismiss() {
    if (activePrayer) dismissPrayer(activePrayer.name);
    handleLeave();
  }

  if (!rendered || !activePrayer || !showPrayerPopup) return null;

  const meta = PRAYER_META[activePrayer.name];

  return (
    <div
      className="fixed left-0 right-0 z-40 flex justify-center px-4"
      style={{
        bottom: "80px",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      <div
        className="w-full max-w-sm"
        style={{
          transform: visible ? "translateY(0) scale(1)" : "translateY(16px) scale(0.97)",
          opacity: visible ? 1 : 0,
          transition: leaving
            ? "transform 0.35s cubic-bezier(0.4,0,1,1), opacity 0.3s ease"
            : "transform 0.45s cubic-bezier(0.16,1,0.3,1), opacity 0.35s ease",
        }}
      >
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: isDark ? "rgba(15,23,42,0.92)" : "rgba(255,255,255,0.94)",
            border: "1px solid var(--accent-border)",
            boxShadow: isDark
              ? "0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)"
              : "0 8px 32px rgba(0,0,0,0.10), 0 0 0 1px rgba(255,255,255,0.8)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          <div className="flex items-center gap-3 px-4 py-3.5">

            {/* Icon pill */}
            <div
              className="flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0"
              style={{
                background: "var(--accent-subtle)",
                color: "var(--accent)",
              }}
            >
              {meta.icon}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span
                  className="text-sm font-semibold"
                  style={{ color: "var(--foreground)" }}
                >
                  Waktu {activePrayer.name}
                </span>
                <span className="text-xs" style={{ color: "var(--muted)" }}>·</span>
                <span
                  className="text-xs tabular-nums"
                  style={{ color: "var(--accent)" }}
                >
                  {formatTime(activePrayer.time)}
                </span>
                <span
                  className="text-xs ml-auto"
                  style={{
                    color: "var(--muted)",
                    fontFamily: "serif",
                    letterSpacing: "0.03em",
                  }}
                >
                  {meta.arabic}
                </span>
              </div>
              <p className="text-xs mt-0.5 truncate" style={{ color: "var(--muted)" }}>
                {meta.reminder}
              </p>
            </div>

            {/* Dismiss */}
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-opacity hover:opacity-70"
              style={{
                background: "var(--accent-subtle)",
                color: "var(--muted)",
              }}
              aria-label="Tutup"
            >
              <IconX size={14} stroke={2} />
            </button>
          </div>

          {/* Countdown progress bar — shrinks from current remaining width → 0 */}
          <div className="h-[2px] w-full" style={{ background: "var(--accent-subtle)" }}>
            <div
              style={{
                height: "100%",
                width: barWidth,
                background: "var(--accent)",
                transition: `width ${barDuration} linear`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}