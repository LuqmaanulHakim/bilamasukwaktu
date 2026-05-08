"use client";

import { useEffect, useState } from "react";
import { Prayer } from "../hooks/useWaktuSolat";

export default function SunTimeline({ data }: { data: Prayer }) {
  const [currentHour, setCurrentHour] = useState(0);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hour = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
      setCurrentHour(hour);
    };

    let frame: number;
    const animate = () => {
      updateTime();
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  function convertToHour(time: string) {
    const [h, m] = time.split(":").map(Number);
    return h + m / 60;
  }

  const sunrise = convertToHour(data.syuruk);
  const sunset = convertToHour(data.maghrib);
  const progress = (currentHour - sunrise) / (sunset - sunrise);
  const safeProgress = Math.max(0, Math.min(1, progress));

  const radius = 140;
  const angle = Math.PI * (1 - safeProgress);
  const x = radius + radius * Math.cos(angle);
  const y = radius - radius * Math.sin(angle);

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-neutral-200">
      <div className="mb-6">
        <p className="text-sm text-neutral-500">Sunrise to Sunset</p>
        <h2 className="text-xl font-semibold text-neutral-900">Daylight</h2>
      </div>

      <div className="relative w-full flex justify-center">
        <div className="relative" style={{ width: radius * 2, height: radius }}>
          <svg
            width={radius * 2}
            height={radius}
            className="absolute inset-0 overflow-visible"
          >
            {/* Background Arc */}
            <path
              d={`M 0 ${radius} A ${radius} ${radius} 0 0 1 ${radius * 2} ${radius}`}
              fill="none"
              stroke="#e5e5e5"
              strokeWidth="6"
              strokeLinecap="round"
            />

            {/* Active Progress Arc */}
            <path
              d={`M 0 ${radius} A ${radius} ${radius} 0 0 1 ${radius * 2} ${radius}`}
              fill="none"
              stroke="#171717"
              strokeWidth="6"
              strokeLinecap="round"
              pathLength="100"
              strokeDasharray={`${safeProgress * 100} 100`}
            />

            {/* Sunrise dot — mathematically pinned to arc start */}
            <circle cx={0} cy={radius} r={5} fill="#fde047" />

            {/* Sunset dot — mathematically pinned to arc end */}
            <circle cx={radius * 2} cy={radius} r={5} fill="#fde047" />
          </svg>

          {/* Moving Sun */}
          <div
            className="absolute w-4 h-4 rounded-full bg-neutral-900"
            style={{
              left: x - 8,
              top: y - 8,
              boxShadow: "0 0 20px rgba(0,0,0,0.15)",
            }}
          />
        </div>
      </div>

      <div className="flex justify-between mt-6 text-sm">
        <div>
          <p className="text-neutral-400">Sunrise</p>
          <p className="font-medium text-neutral-800">{data.syuruk}</p>
        </div>
        <div className="text-right">
          <p className="text-neutral-400">Sunset</p>
          <p className="font-medium text-neutral-800">{data.maghrib}</p>
        </div>
      </div>
    </div>
  );
}