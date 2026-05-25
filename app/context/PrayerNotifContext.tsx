"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";

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
const PWA_STARTUP_DELAY_MS = 800;

function addMinutes(date: Date, mins: number): Date {
  return new Date(date.getTime() + mins * 60 * 1000);
}

function toTimeStr(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function PrayerNotifProvider({ children }: { children: React.ReactNode }) {
  const [zone, setZone] = useState<string>("");
  const [activePrayer, setActivePrayer] = useState<ActivePrayer | null>(null);
  const [isReady, setIsReady] = useState(false);

  const dismissedRef = useRef<Set<string>>(new Set());
  const timerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleRef  = useRef<() => void>(() => {});

  useEffect(() => {
    const stored = localStorage.getItem("selectedZone") ?? "";
    if (stored) setZone(stored);
    const t = setTimeout(() => setIsReady(true), PWA_STARTUP_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const now = new Date();
    const msUntilMidnight =
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();
    const t = setTimeout(() => {
      dismissedRef.current = new Set();
      scheduleRef.current();
    }, msUntilMidnight);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    // Hardcoded: Zohor = now, each subsequent prayer 2 minutes later
    const base = new Date();
    const prayers: { name: PrayerName; time: string }[] = [
      { name: "Subuh",   time: "05:00" },
      { name: "Syuruk",  time: "07:10" },
      { name: "Zohor",   time: toTimeStr(base) },                  // now
      { name: "Asar",    time: toTimeStr(addMinutes(base, 1)) },   // now + 2min
      { name: "Maghrib", time: toTimeStr(addMinutes(base, 4)) },   // now + 4min
      { name: "Isya",    time: toTimeStr(addMinutes(base, 6)) },   // now + 6min
    ];

    console.log("[DEBUG] Prayer schedule:");
    prayers.forEach(p => console.log(` ${p.name}: ${p.time}`));

    function toMs(time: string): number {
      const [h, m] = time.split(":").map(Number);
      const d = new Date();
      d.setHours(h, m, 0, 0);
      return d.getTime();
    }

    function schedule() {
      if (timerRef.current) clearTimeout(timerRef.current);

      const nowMs = Date.now();
      console.log("[DEBUG] schedule() at", new Date().toLocaleTimeString());

      for (let i = 0; i < prayers.length; i++) {
        const { name, time } = prayers[i];
        const start = toMs(time);
        const diff  = nowMs - start;

        if (diff >= 0 && diff < POPUP_WINDOW_MS) {
          const key = `${name}-${new Date().toDateString()}`;
          console.log(`[DEBUG] Inside window: ${name}, dismissed=${dismissedRef.current.has(key)}`);

          if (!dismissedRef.current.has(key)) {
            setActivePrayer({ name, time, minutesIn: Math.floor(diff / 60000) });
            const msUntilEnd = start + POPUP_WINDOW_MS - nowMs;
            console.log(`[DEBUG] Showing ${name}, auto-hide in ${msUntilEnd}ms`);
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
            console.log(`[DEBUG] ${name} dismissed, next: ${next.name} in ${msUntilNext}ms`);
            if (msUntilNext > 0) timerRef.current = setTimeout(schedule, msUntilNext);
          } else {
            setActivePrayer(null);
          }
          return;
        }

        if (diff < 0) {
          setActivePrayer(null);
          console.log(`[DEBUG] Waiting ${-diff}ms for ${name}`);
          timerRef.current = setTimeout(schedule, -diff);
          return;
        }
      }

      setActivePrayer(null);
      console.log("[DEBUG] All prayers passed");
    }

    scheduleRef.current = schedule;
    schedule();

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isReady]);

  const dismissPrayer = useCallback((name: PrayerName) => {
    const key = `${name}-${new Date().toDateString()}`;
    console.log(`[DEBUG] Dismissed: ${name}`);
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