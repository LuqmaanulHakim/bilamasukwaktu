"use client";

import { useTheme } from "../context/ThemeContext";

type Props = {
  selectedZone: any;
  zikirText: string;
  getMalayDate: (date: Date) => string;
};

export default function IslamicDashboardCard({
  selectedZone,
  zikirText,
  getMalayDate,
}: Props) {
  const { theme } = useTheme();

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
            <pattern
              id="pattern"
              width="70"
              height="70"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M35 0 L70 35 L35 70 L0 35 Z"
                fill="none"
                stroke="white"
                strokeWidth="1"
              />
              <circle
                cx="35"
                cy="35"
                r="8"
                fill="none"
                stroke="white"
                strokeWidth="1"
              />
            </pattern>
          </defs>

          <rect width="100%" height="100%" fill="url(#pattern)" />
        </svg>
      </div>

      {/* Glow */}
      <div
        className="absolute -top-10 -right-10 w-56 h-56 rounded-full blur-3xl opacity-20"
        style={{ background: "var(--accent)" }}
      ></div>

      {/* HEADER */}
      <div className="relative z-10">
        <h2 className="text-white text-xl font-bold">
          {selectedZone?.negeri}
        </h2>

        <p className="text-white/70 text-sm mt-1">
          {selectedZone?.daerah || "Prayer Times"}
        </p>

        <p className="text-white text-sm font-semibold mt-1">
          {getMalayDate(new Date())}
        </p>
      </div>

      {/* DIVIDER */}
      <div className="my-4 h-[1px] bg-white/10"></div>

      {/* ZIKIR */}
      <div>
        <h3 className="text-center text-white/60 text-xs uppercase tracking-[0.4em]">
          Zikir Harian
        </h3>

        <h1
          className="text-center text-[22px] leading-[2.6rem] text-white mt-2"
          style={{
            fontFamily: "'Amiri', serif",
          }}
        >
          {zikirText}
        </h1>
      </div>
    </section>
  );
}