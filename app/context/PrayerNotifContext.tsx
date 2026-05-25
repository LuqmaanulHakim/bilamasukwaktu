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
  // isReady now only flips after BOTH the startup delay AND data have arrived
  const [startupDone, setStartupDone] = useState(false);

  const dismissedRef = useRef<Set<string>>(new Set());
  const timerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleRef  = useRef<() => void>(() => {});

  const { week } = useWaktuSolatWeek(zone);
  const data = week[0] ?? null;

  // Load zone + mark startup done after a short delay
  useEffect(() => {
    const stored = localStorage.getItem("selectedZone") ?? "";
    if (stored) setZone(stored);

    const t = setTimeout(() => setStartupDone(true), 800);
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
    // Wait for BOTH startup delay and API data — whichever comes last
    if (!startupDone || !data) return;

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
  }, [data, startupDone]); // fires when BOTH are ready, whichever arrives last

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