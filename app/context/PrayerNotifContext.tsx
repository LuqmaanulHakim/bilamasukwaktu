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

// On PWA cold start, wait a bit before showing popup so the UI finishes painting
const PWA_STARTUP_DELAY_MS = 800;

export function PrayerNotifProvider({ children }: { children: React.ReactNode }) {
  const [zone, setZone] = useState<string>("");
  const [activePrayer, setActivePrayer] = useState<ActivePrayer | null>(null);
  const [isReady, setIsReady] = useState(false); // gates popup until app is settled

  const dismissedRef = useRef<Set<string>>(new Set());
  const timerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleRef  = useRef<() => void>(() => {});

  const { week } = useWaktuSolatWeek(zone);
  const data = week[0] ?? null;

  // Load zone + mark ready after startup delay
  useEffect(() => {
    const stored = localStorage.getItem("selectedZone") ?? "";
    if (stored) setZone(stored);

    // Give the PWA time to fully render before we start showing popups
    const t = setTimeout(() => setIsReady(true), PWA_STARTUP_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  // Reset dismissed set at midnight
  useEffect(() => {
    const now = new Date();
    const msUntilMidnight =
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() -
      now.getTime();
    const t = setTimeout(() => {
      dismissedRef.current = new Set();
      scheduleRef.current();
    }, msUntilMidnight);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!data || !isReady) return;

    const prayers: { name: PrayerName; time: string }[] = [
      { name: "Subuh",   time: data.fajr },
      { name: "Syuruk",  time: data.syuruk },
      { name: "Zohor",   time: data.dhuhr },
      { name: "Asar",    time: data.asr },
      { name: "Maghrib", time: data.maghrib },
      { name: "Isya",    time: data.isha },
    ];

    function toMs(time: string): number {
      const [h, m] = time.split(":").map(Number);
      const d = new Date();
      d.setHours(h, m, 0, 0);
      return d.getTime();
    }

    function schedule() {
      if (timerRef.current) clearTimeout(timerRef.current);

      const nowMs = Date.now();

      for (let i = 0; i < prayers.length; i++) {
        const { name, time } = prayers[i];
        const start = toMs(time);
        const diff  = nowMs - start;

        if (diff >= 0 && diff < POPUP_WINDOW_MS) {
          const key = `${name}-${new Date().toDateString()}`;

          if (!dismissedRef.current.has(key)) {
            setActivePrayer({ name, time, minutesIn: Math.floor(diff / 60000) });

            const msUntilEnd = start + POPUP_WINDOW_MS - nowMs;
            timerRef.current = setTimeout(() => {
              setActivePrayer(null);
              schedule();
            }, msUntilEnd);
            return;
          }

          // Dismissed — jump to next prayer
          const next = prayers[i + 1];
          if (next) {
            setActivePrayer(null);
            const msUntilNext = toMs(next.time) - nowMs;
            if (msUntilNext > 0) {
              timerRef.current = setTimeout(schedule, msUntilNext);
            }
          } else {
            setActivePrayer(null);
          }
          return;
        }

        if (diff < 0) {
          setActivePrayer(null);
          timerRef.current = setTimeout(schedule, -diff);
          return;
        }
      }

      setActivePrayer(null);
    }

    scheduleRef.current = schedule;
    schedule();

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [data, isReady]); // re-runs once isReady flips to true

  const dismissPrayer = useCallback((name: PrayerName) => {
    const key = `${name}-${new Date().toDateString()}`;
    dismissedRef.current.add(key);
    setActivePrayer(null);
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