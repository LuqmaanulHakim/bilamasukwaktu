"use client";

import { useEffect, useState } from "react";
import { getPrayerTimes } from "../lib/api";

export type PrayerWeek = {
  hijri: string;
  date: string;
  day: string;
  fajr: string;
  syuruk: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
};

export function useWaktuSolatWeek(zone: string) {
  const [week, setWeek] = useState<PrayerWeek[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await getPrayerTimes(zone);

        if (!res?.prayerTime) {
          throw new Error("Invalid API response");
        }

        const todayIndex = new Date().getDate() - 1;
        const weekEntries: PrayerWeek[] = res.prayerTime.slice(todayIndex, todayIndex + 7);

        setWeek(weekEntries);
        setError(null);
      } catch (err) {
        console.error("Prayer week API error:", err);
        setError("Failed to load weekly prayer times");
        setWeek([]);
      }
    }

    if (zone) fetchData();
  }, [zone]);

  return { week, error };
}