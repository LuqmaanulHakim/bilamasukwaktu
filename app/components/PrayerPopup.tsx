"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "../context/ThemeContext";
import { PrayerPopupData } from "../hooks/usePrayerPopup";

interface PrayerPopupProps {
  popup: PrayerPopupData;
  onDismiss: () => void;
}

export default function PrayerPopup({ popup, onDismiss }: PrayerPopupProps) {
  const { theme } = useTheme();
  const isDark  = theme === "dark";
  const visible = popup !== null;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-dismiss after 60 s if user ignores it
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (visible) {
      timerRef.current = setTimeout(onDismiss, 60_000);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [visible, onDismiss]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onDismiss}
        className="fixed inset-0 z-40 transition-opacity duration-300"
        style={{
          background: "rgba(0,0,0,0.5)",
          opacity: visible ? 1 : 0,
          pointerEvents: visible ? "auto" : "none",
        }}
      />

      {/* Bottom sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-out"
        style={{ transform: visible ? "translateY(0)" : "translateY(100%)" }}
      >
        <div
          className="rounded-t-3xl border-t border-x shadow-2xl"
          style={{
            background: "var(--card-bg)",
            borderColor: "var(--card-border)",
            paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))",
          }}
        >
          {/* Pull handle */}
          <div className="flex justify-center pt-4 pb-2">
            <div
              className="w-10 h-1 rounded-full"
              style={{ background: isDark ? "#475569" : "#cbd5e1" }}
            />
          </div>

          <div className="px-6 pt-2 pb-2">
            {/* Mosque icon */}
            <div className="flex justify-center mb-5">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
                style={{ background: "var(--accent-subtle)" }}
              >
                🕌
              </div>
            </div>

            {/* Prayer info */}
            <div className="text-center mb-6">
              <p className="text-sm mb-2" style={{ color: "var(--muted)" }}>
                Masuk waktu solat
              </p>
              <h2
                className="text-4xl font-bold mb-2"
                style={{ color: "var(--foreground)" }}
              >
                {popup?.name}
              </h2>
              <p
                className="text-2xl font-semibold tabular-nums"
                style={{ color: "var(--accent)" }}
              >
                {popup?.time}
              </p>
            </div>

            {/* Divider */}
            <div
              className="mb-5"
              style={{ borderTop: "1px solid var(--card-border)" }}
            />

            {/* Dismiss */}
            <button
              onClick={onDismiss}
              className="w-full py-4 rounded-2xl text-base font-semibold active:opacity-70 transition-opacity"
              style={{ background: "var(--accent)", color: "#ffffff" }}
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </>
  );
}