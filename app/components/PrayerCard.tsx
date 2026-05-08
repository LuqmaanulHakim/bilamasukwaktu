"use client";

export default function PrayerCard({
  name,
  time,
}: {
  name: string;
  time: string;
}) {
  const formattedTime = time.slice(0, 5);

  return (
    <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-4 shadow border border-white/50 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div>
          <p className="text-gray-500 text-sm">
            {name}
          </p>

          <p className="font-semibold text-lg">
            {formattedTime}
          </p>
        </div>
      </div>
    </div>
  );
}