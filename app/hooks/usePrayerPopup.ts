"use client";

import { useEffect, useRef, useState } from "react";
import { PrayerWeek } from "./useWaktuSolatWeek";

export type PrayerPopupData = {
  name: string;
  time: string;
} | null;

const PRAYER_KEYS: { name: string; key: keyof PrayerWeek }[] = [
  { name: "Subuh",   key: "fajr"    },
  { name: "Syuruk",  key: "syuruk"  },
  { name: "Zohor",   key: "dhuhr"   },
  { name: "Asar",    key: "asr"     },
  { name: "Maghrib", key: "maghrib" },
  { name: "Isya",    key: "isha"    },
];

export function usePrayerPopup(today: PrayerWeek | null) {
  const [popup, setPopup] = useState<PrayerPopupData>(null);
  const firedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!today) return;

    const interval = setInterval(() => {
      const now  = new Date();
      const hh   = now.getHours().toString().padStart(2, "0");
      const mm   = now.getMinutes().toString().padStart(2, "0");
      const currentTime = `${hh}:${mm}`;

      for (const { name, key } of PRAYER_KEYS) {
        const prayerTime = today[key] as string;
        const normalised = prayerTime.slice(0, 5); // strip seconds if present
        const fireKey    = `${today.date}-${key}`;

        if (normalised === currentTime && !firedRef.current.has(fireKey)) {
          firedRef.current.add(fireKey);
          setPopup({ name, time: normalised });
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [today]);

  return {
    popup,
    dismiss: () => setPopup(null),
  };
}