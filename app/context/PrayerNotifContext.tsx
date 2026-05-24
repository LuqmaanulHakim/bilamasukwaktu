"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { useWaktuSolatWeek } from "../hooks/useWaktuSolatWeek";

export type PrayerName = "Subuh" | "Syuruk" | "Zohor" | "Asar" | "Maghrib" | "Isya";

export interface ActivePrayer {
  name: PrayerName;
  time: string;
  minutesIn: number;
}

interface PrayerNotifContextValue {
  activePrayer: ActivePrayer | null;
  dismissPrayer: (name: PrayerName) => void;
  zone: string;
  setZone: (zone: string) => void;
}

const PrayerNotifContext = createContext<PrayerNotifContextValue>({
  activePrayer: null,
  dismissPrayer: () => {},
  zone: "",
  setZone: () => {},
});

const POPUP_WINDOW_MS = 15 * 1000;

export function PrayerNotifProvider({ children }: { children: React.ReactNode }) {
  const [zone, setZone] = useState<string>("");
  const [activePrayer, setActivePrayer] = useState<ActivePrayer | null>(null);

  // Dismissed prayers survive for the lifetime of this render session only.
  // On refresh they reset — popup will show again. This is intentional.
  const dismissedRef = useRef<Set<string>>(new Set());
  const timerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleRef  = useRef<() => void>(() => {});

  const { week } = useWaktuSolatWeek(zone);
  const data = week[0] ?? null;

  // Load zone from localStorage once
  useEffect(() => {
    const stored = localStorage.getItem("selectedZone") ?? "";
    if (stored) setZone(stored);
  }, []);

  // Reset dismissed set at midnight
  useEffect(() => {
    const now = new Date();
    const msUntilMidnight =
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() -
      now.getTime();
    const t = setTimeout(() => {
      dismissedRef.current = new Set();
      scheduleRef.current(); // re-check after midnight
    }, msUntilMidnight);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!data) return;

    const prayers: { name: PrayerName; time: string }[] = [
      { name: "Subuh",   time: data.fajr },
      { name: "Syuruk",  time: data.syuruk },
      { name: "Zohor",   time: data.dhuhr },
      { name: "Asar",    time: data.asr },
      { name: "Maghrib", time: data.maghrib },
      { name: "Isya",    time: data.isha },
    ];

    // Returns the absolute ms timestamp for a "HH:MM" string today
    function toMs(time: string): number {
      const [h, m] = time.split(":").map(Number);
      const d = new Date();
      d.setHours(h, m, 0, 0);
      return d.getTime();
    }

    function schedule() {
      if (timerRef.current) clearTimeout(timerRef.current);

      const nowMs = Date.now();

      // Walk prayers in order to find where we are right now
      for (let i = 0; i < prayers.length; i++) {
        const { name, time } = prayers[i];
        const start = toMs(time);
        const diff  = nowMs - start;

        if (diff >= 0 && diff < POPUP_WINDOW_MS) {
          // We are inside this prayer's window
          const key = `${name}-${new Date().toDateString()}`;

          if (!dismissedRef.current.has(key)) {
            // Show popup
            setActivePrayer({ name, time, minutesIn: Math.floor(diff / 60000) });

            // Auto-hide exactly when window closes
            const msUntilEnd = start + POPUP_WINDOW_MS - nowMs;
            timerRef.current = setTimeout(() => {
              setActivePrayer(null);
              schedule(); // move on to next prayer
            }, msUntilEnd);
            return;
          }

          // This prayer was dismissed — skip to the next prayer's start
          const next = prayers[i + 1];
          if (next) {
            setActivePrayer(null);
            const msUntilNext = toMs(next.time) - nowMs;
            if (msUntilNext > 0) {
              timerRef.current = setTimeout(schedule, msUntilNext);
            }
          } else {
            // No more prayers today — wait for midnight (handled by midnight effect)
            setActivePrayer(null);
          }
          return;
        }

        if (diff < 0) {
          // This prayer hasn't started yet — set timer for when it begins
          setActivePrayer(null);
          timerRef.current = setTimeout(schedule, -diff);
          return;
        }

        // diff >= POPUP_WINDOW_MS — window already passed, check next prayer
      }

      // All prayers passed today
      setActivePrayer(null);
    }

    scheduleRef.current = schedule;
    schedule();

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [data]);

  const dismissPrayer = useCallback((name: PrayerName) => {
    const key = `${name}-${new Date().toDateString()}`;
    dismissedRef.current.add(key);
    setActivePrayer(null);
    // Jump to scheduling the next prayer
    scheduleRef.current();
  }, []);

  return (
    <PrayerNotifContext.Provider value={{ activePrayer, dismissPrayer, zone, setZone }}>
      {children}
    </PrayerNotifContext.Provider>
  );
}

export function usePrayerNotif() {
  return useContext(PrayerNotifContext);
}