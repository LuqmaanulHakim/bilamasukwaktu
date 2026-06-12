"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type Props = {
  selectedZone: any;
  getMalayDate: (date: Date) => string;
};

const dailyZikir: Record<string, string> = {
  Isnin: "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ الْعَلِيِّ الْعَظِيم",
  Selasa: "اللَّهُمَّ صَلِّ عَلَى عَبْدِكَ وَرَسُولِكَ وَنَبِيِّكَ الأَمِينِ وَعَلَى آلِهِ وَصَحْبِهِ وَسَلِّمْ",
  Rabu: "اَسْتَغْفِرُاللهَ الْعَظِيْمَ",
  Khamis: "سُبْحَانَ اللَّهِ العَظِيم سُبْحَانَ اللَّهِ وَبِحَمْدِهِ",
  Jumaat: "يَا اللّٰهُ",
  Sabtu: "لَا إِلَٰهَ إِلَّا ٱللَّٰهُ",
  Ahad: "يَا حَيُّ يَا قَيُّومُ",
};

const negeriImageMap: Record<string, string> = {
  "Johor": "Johor",
  "Kedah": "Kedah",
  "Kelantan": "Kelantan",
  "Negeri Sembilan": "NegeriSembilan",
  "Pahang": "Pahang",
  "Perak": "Perak",
  "Pulau Pinang": "PulauPinang",
  "Sabah": "Sabah",
  "Sarawak": "Sarawak",
  "Selangor": "Selangor",
  "Terengganu": "Terengganu",
  "Melaka": "Melaka",
};

function getWilayahImage(daerah?: string): string | null {
  if (!daerah) return null;
  const d = daerah.toLowerCase();
  if (d.includes("labuan")) return "/negeri/Labuan.png";
  if (d.includes("putrajaya") || d.includes("kuala lumpur")) return "/negeri/KualaLumpur.png";
  return null;
}

function getNegeriImage(negeri?: string, daerah?: string): string | null {
  if (!negeri) return null;

  const n = negeri.toLowerCase();

  if (n.includes("wilayah persekutuan") || n.includes("w.p.")) {
    return getWilayahImage(daerah);
  }

  const key = Object.keys(negeriImageMap).find(
    (k) => k.toLowerCase() === n
  );
  return key ? `/negeri/${negeriImageMap[key]}.png` : null;
}

export default function DashboardCard({ selectedZone, getMalayDate }: Props) {
  const [now, setNow] = useState(() => new Date());
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const scheduleNextDay = () => {
      const current = new Date();
      const msUntilMidnight =
        new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1).getTime() -
        current.getTime();

      const timeout = setTimeout(() => {
        setNow(new Date());
        scheduleNextDay();
      }, msUntilMidnight);

      return timeout;
    };

    const timeout = scheduleNextDay();
    return () => clearTimeout(timeout);
  }, []);

  const currentDay = now.toLocaleDateString("ms-MY", { weekday: "long" });
  const zikirText = dailyZikir[currentDay];
  const negeriImage = getNegeriImage(selectedZone?.negeri, selectedZone?.daerah);

  // Reset fade-in whenever the image source changes
  useEffect(() => {
    setImageLoaded(false);
  }, [negeriImage]);

  return (
    <section
      className="relative overflow-hidden rounded-[40px] p-5 border shadow-2xl"
      style={{
        background:
          "radial-gradient(circle at top left, rgba(255,255,255,0.08), transparent 40%), linear-gradient(145deg, #0b1220, #0f172a)",
        borderColor: "rgba(255,255,255,0.08)",
      }}
    >
      {/* Islamic Pattern */}
      <div className="absolute inset-0 opacity-[0.05]">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="pattern" width="70" height="70" patternUnits="userSpaceOnUse">
              <path d="M35 0 L70 35 L35 70 L0 35 Z" fill="none" stroke="white" strokeWidth="1" />
              <circle cx="35" cy="35" r="8" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pattern)" />
        </svg>
      </div>

      {/* Glow */}
      <div
        className="absolute -top-10 -right-10 w-56 h-56 rounded-full blur-3xl opacity-20"
        style={{ background: "var(--accent)" }}
      />

      {/* Header */}
      <div className="relative z-10">
        <h2 className="text-white text-xl font-bold">
          {selectedZone?.negeri?.toLowerCase().includes("wilayah persekutuan") ||
          selectedZone?.negeri?.toLowerCase().includes("w.p.")
            ? selectedZone?.daerah
            : selectedZone?.negeri}
        </h2>
        <p className="text-white/70 text-sm mt-1">
          {selectedZone?.negeri?.toLowerCase().includes("wilayah persekutuan") ||
          selectedZone?.negeri?.toLowerCase().includes("w.p.")
            ? selectedZone?.negeri
            : selectedZone?.daerah || "Prayer Times"}
        </p>
        <p className="text-white text-sm font-semibold mt-1">{getMalayDate(now)}</p>
      </div>

      {/* Zikir */}
      <div>
        <h3 className="text-center text-white/60 text-xs uppercase tracking-[0.4em] mt-3">
          Zikir Harian
        </h3>
        <h1
          className="text-center text-[18px] text-white mt-3 leading-tight"
          style={{ fontFamily: "'Amiri', serif" }}
        >
          {zikirText}
        </h1>
      </div>

      {/* State Image — only rendered if a matching image exists */}
      {negeriImage && (
        <div className="absolute -right-20 top-1/2 -translate-y-20 w-52 h-52 pointer-events-none">
          <Image
            src={negeriImage}
            alt={selectedZone?.negeri ?? ""}
            fill
            className="object-contain object-right transition-opacity duration-700"
            style={{ opacity: imageLoaded ? 0.75 : 0 }}
            onLoad={() => setImageLoaded(true)}
            priority
          />
        </div>
      )}
    </section>
  );
}