"use client";

type Props = {
  data: any;
};

export default function PrayerTimesGrid({
  data,
}: Props) {
  const prayers = [
    {
      name: "Subuh",
      time: data.fajr,
    },
    {
      name: "Syuruk",
      time: data.syuruk,
    },
    {
      name: "Zohor",
      time: data.dhuhr,
    },
    {
      name: "Asar",
      time: data.asr,
    },
    {
      name: "Maghrib",
      time: data.maghrib,
    },
    {
      name: "Isha",
      time: data.isha,
    },
  ];

  return (
    <section className="bg-white/70 backdrop-blur-lg rounded-3xl border border-white/50 shadow p-2">
      <div className="grid grid-cols-3 gap-4 text-center">
        {prayers.map((prayer) => (
          <div
            key={prayer.name}
            className="bg-white/40 rounded-2xl py-3"
          >
            <p className="text-gray-500 text-sm">
              {prayer.name}
            </p>

            <p className="font-semibold text-lg mt-1">
              {prayer.time?.slice(0, 5)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}