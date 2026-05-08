"use client";

import { useEffect, useState } from "react";
import { getPrayerTimes } from "../lib/api";

export type Prayer = {
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

export function useWaktuSolat(zone: string) {
  const [data, setData] = useState<Prayer | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        console.log("Fetching prayer times for:", zone);

        const res = await getPrayerTimes(zone);

        if (!res?.prayerTime) {
          throw new Error("Invalid API response");
        }

        // API already returns list → just take today's entry safely
        const todayIndex = new Date().getDate() - 1;

        const prayerToday =
          res.prayerTime?.[todayIndex] || res.prayerTime?.[0];

        setData(prayerToday);
        setError(null);
      } catch (err) {
        console.error("Prayer API error:", err);
        setError("Failed to load prayer times");
        setData(null);
      }
    }

    if (zone) {
      fetchData();
    }
  }, [zone]);

  return { data, error };
}