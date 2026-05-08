"use client";

import { Prayer } from "../hooks/useWaktuSolat";

export default function PrayerTimes({ data }: { data: Prayer }) {
  return (
    <div className="grid gap-3 p-4 rounded-xl bg-white shadow">
      <h2 className="text-lg font-semibold">
        {data.day} - {new Date().toLocaleDateString("en-MY", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        })}
      </h2>

      <Time label="Fajr" time={data.fajr} />
      <Time label="Syuruk" time={data.syuruk} />
      <Time label="Dhuhr" time={data.dhuhr} />
      <Time label="Asr" time={data.asr} />
      <Time label="Maghrib" time={data.maghrib} />
      <Time label="Isha" time={data.isha} />
    </div>
  );
}

function Time({ label, time }: { label: string; time: string }) {
  return (
    <div className="flex justify-between border-b py-1">
      <span>{label}</span>
      <span className="font-mono">{time}</span>
    </div>
  );
}