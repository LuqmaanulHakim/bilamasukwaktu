"use client";

import { Prayer } from "../hooks/useWaktuSolat";

export default function SunPath({ data }: { data: Prayer }) {
  return (
    <div className="p-4 rounded-xl bg-white shadow space-y-3">
      <h2 className="font-semibold text-lg">
        Sunrise – Sunset Timeline
      </h2>

      {/* Timeline bar */}
      <div className="relative w-full h-3 bg-blue-100 rounded-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-300 via-yellow-300 to-orange-400" />
      </div>

      {/* Markers */}
      <div className="relative mt-2 text-xs text-gray-600">
        <div className="flex justify-between">
          <span>🌙 Fajr<br />{data.fajr}</span>
          <span>🌅 Syuruk<br />{data.syuruk}</span>
          <span>☀️ Dhuhr<br />{data.dhuhr}</span>
          <span>🌤️ Asr<br />{data.asr}</span>
          <span>🌇 Maghrib<br />{data.maghrib}</span>
          <span>🌙 Isha<br />{data.isha}</span>
        </div>
      </div>
    </div>
  );
}