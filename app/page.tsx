"use client";

import PrayerTimesGrid from "./components/PrayerTimesGrid";
import SunTimeline from "./components/SunTimeline";
import { useZones } from "./hooks/useZones";
import { useWaktuSolat } from "./hooks/useWaktuSolat";
import { useSelectedZone } from "./hooks/useSelectedZone";

export default function Home() {
  const { zones, loading: zonesLoading } = useZones();
  const { zone } = useSelectedZone();
  const { data, error } = useWaktuSolat(zone);

  if (zonesLoading) {
    return <div className="p-6">Loading zones...</div>;
  }

  if (error) {
    return <div className="p-6">Error loading prayer times</div>;
  }

  if (!data) {
    return <div className="p-6">Loading prayer times...</div>;
  }

  const selectedZone = zones.find((z: any) => z.jakimCode === zone);

  return (
    <main className="w-full max-w-md mx-auto min-h-screen px-4 py-4 pb-24 space-y-5">
      {/* HERO */}
      <section className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-3xl p-6 shadow-xl">
        <p className="text-sm opacity-80">Today's Prayer Times</p>
        <h1 className="text-2xl font-bold mt-1">{selectedZone?.negeri}</h1>
        <p className="mt-1 text-sm opacity-80">
          {selectedZone?.daerah || "Prayer Times"}
        </p>
        <p className="mt-2 opacity-90 text-sm">
          {new Date().toLocaleDateString("en-MY", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </section>

      {/* TIMELINE */}
      <SunTimeline data={data} />

      {/* PRAYER TIMES */}
      <PrayerTimesGrid data={data} />
    </main>
  );
}