"use client";

import { useEffect, useState } from "react";
import { Prayer } from "../hooks/useWaktuSolat";
import { useTheme } from "../context/ThemeContext";

export default function SunTimeline({ data }: { data: Prayer }) {
  const [currentHour, setCurrentHour] = useState(0);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hour = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
      setCurrentHour(hour);
    };
    let frame: number;
    const animate = () => { updateTime(); frame = requestAnimationFrame(animate); };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  function convertToHour(time: string) {
    const [h, m] = time.split(":").map(Number);
    return h + m / 60;
  }

  function formatTimeWithoutSeconds(time: string) {
    return time.split(":").slice(0, 2).join(":");
  }

  const sunrise = convertToHour(data.syuruk);
  const sunset  = convertToHour(data.maghrib);

  // SVG layout constants
  const svgW   = 320;
  const svgH   = 200;
  const padX   = 20;
  const axisY  = 130;
  const amp    = 100;
  const dipAmp = 38;
  const visW   = svgW - 2 * padX;
  const STEPS  = 600;

  // Map degree (-90 to 270) → SVG x/y coordinates
  function degToX(deg: number) {
    return padX + ((deg + 90) / 360) * visW;
  }

  function degToY(deg: number) {
    const s = Math.sin((deg * Math.PI) / 180);
    return axisY - (s > 0 ? s * amp : s * dipAmp);
  }

  // Map clock hour (0–24) → degree on the sine curve
  //   00:00   → -90°  (left bottom, start of left night dip)
  //   sunrise →   0°  (left axis crossing)
  //   noon    →  90°  (top of arc)
  //   sunset  → 180°  (right axis crossing)
  //   24:00   → 270°  (right bottom, end of right night dip)
  function hourToDeg(hour: number): number {
    if (hour <= sunrise) {
      return -90 + (hour / sunrise) * 90;
    } else if (hour <= sunset) {
      return ((hour - sunrise) / (sunset - sunrise)) * 180;
    } else {
      return 180 + ((hour - sunset) / (24 - sunset)) * 90;
    }
  }

  // Fixed x positions for axis landmarks
  const xMinus90 = degToX(-90);
  const x0       = degToX(0);
  const x180     = degToX(180);
  const x270     = degToX(270);

  // Build all points along the full sine curve
  const allPoints: [number, number][] = [];
  for (let i = 0; i <= STEPS; i++) {
    const deg = -90 + (360 * i) / STEPS;
    allPoints.push([degToX(deg), degToY(deg)]);
  }

  // Sun position — derived from hourToDeg so it always sits on the curve
  const sunDeg      = hourToDeg(currentHour);
  const sunX        = degToX(sunDeg);
  const sunY        = degToY(sunDeg);

  // Active trail: slice allPoints from 0 up to current sun position
  const degFraction  = (sunDeg - (-90)) / 360;
  const sunIdx       = Math.max(0, Math.min(STEPS, Math.round(degFraction * STEPS)));
  const activePoints = allPoints.slice(0, sunIdx + 1);

  // Shaded night dip zones (below axis)
  const startIdx    = Math.round(STEPS / 4);        // deg = 0°   (sunrise)
  const endIdx      = Math.round((STEPS * 3) / 4);  // deg = 180° (sunset)
  const leftDipPts  = allPoints.slice(0, startIdx + 1);
  const rightDipPts = allPoints.slice(endIdx);

  function toSmoothPath(pts: [number, number][], tension = 0.4): string {
    if (pts.length < 2) return "";
    let d = `M ${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(i - 1, 0)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(i + 2, pts.length - 1)];
      const cp1x = p1[0] + (p2[0] - p0[0]) * tension;
      const cp1y = p1[1] + (p2[1] - p0[1]) * tension;
      const cp2x = p2[0] - (p3[0] - p1[0]) * tension;
      const cp2y = p2[1] - (p3[1] - p1[1]) * tension;
      d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
    }
    return d;
  }

  function subsample(pts: [number, number][], n: number): [number, number][] {
    return pts.filter((_, i) => i % n === 0 || i === pts.length - 1);
  }

  const trackPath    = toSmoothPath(subsample(allPoints, 4));
  const activePath   = toSmoothPath(subsample(activePoints, 4));
  const leftDipPath  = `${toSmoothPath(subsample(leftDipPts, 4))} L ${x0} ${axisY} L ${xMinus90} ${axisY} Z`;
  const rightDipPath = `${toSmoothPath(subsample(rightDipPts, 4))} L ${x270} ${axisY} L ${x180} ${axisY} Z`;

  // Label x-offsets to prevent overlap between nearby dots
  // Subuh & Syuruk sit close together on the left; Maghrib & Isya on the right
  function getLabelOffsetX(name: string): number {
    if (name === "Subuh")   return -14;
    if (name === "Syuruk")  return  14;
    if (name === "Maghrib") return -14;
    if (name === "Isya")    return  14;
    return 0;
  }

  // Prayer dots (Subuh, Zohor, Asar, Isya)
  const prayerDots = [
    { name: "Subuh", hour: convertToHour(data.fajr),  labelPos: "below" as const },
    { name: "Zohor", hour: convertToHour(data.dhuhr), labelPos: "above" as const },
    { name: "Asar",  hour: convertToHour(data.asr),   labelPos: "above" as const },
    { name: "Isya",  hour: convertToHour(data.isha),  labelPos: "below" as const },
  ].map(({ name, hour, labelPos }) => {
    const deg    = hourToDeg(hour);
    const px     = degToX(deg);
    const py     = degToY(deg);
    const isPast = hour <= currentHour;
    const labelX = px + getLabelOffsetX(name);
    const labelY = labelPos === "above" ? py - 12 : py + 16;
    return { name, px, py, labelX, labelY, labelPos, isPast };
  });

  // Syuruk & Maghrib dots sit exactly on the axis line
  const sunriseDot = { px: x0,   py: axisY, isPast: sunrise <= currentHour };
  const sunsetDot  = { px: x180, py: axisY, isPast: sunset  <= currentHour };

  // Colors
  const axisColor       = isDark ? "#475569" : "#94a3b8";
  const trackColor      = isDark ? "#334155" : "#e2e8f0";
  const activeColor     = isDark ? "#93c5fd" : "#3b82f6";
  const labelColor      = isDark ? "#64748b" : "#94a3b8";
  const belowFill       = isDark ? "rgba(51,65,85,0.2)" : "rgba(226,232,240,0.35)";
  const prayerDotFill   = isDark ? "#1e293b" : "#ffffff";
  const prayerDotStroke = isDark ? "#93c5fd" : "#3b82f6";
  const leaderColor     = isDark ? "#334155" : "#e2e8f0";

  const isDaytime = currentHour >= sunrise && currentHour <= sunset;
  const sunColor  = isDaytime
    ? (isDark ? "#fbbf24" : "#f59e0b")
    : (isDark ? "#475569" : "#94a3b8");
  const sunGlow = isDaytime
    ? (isDark ? "rgba(251,191,36,0.5)" : "rgba(245,158,11,0.5)")
    : "rgba(100,116,139,0.3)";

  return (
    <div
      className="rounded-3xl p-4 shadow-sm border"
      style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
    >
      <div className="mb-4">
        <p className="text-sm" style={{ color: "var(--muted)" }}>Terbit & Terbenam</p>
        <h2 className="text-xl font-semibold" style={{ color: "var(--foreground)" }}>Matahari</h2>
      </div>

      <div className="w-full flex justify-center">
        <svg
          width="100%"
          viewBox={`0 0 ${svgW} ${svgH}`}
          style={{ overflow: "visible", maxWidth: svgW }}
        >
          {/* Night dip shaded zones */}
          <path d={leftDipPath}  fill={belowFill} />
          <path d={rightDipPath} fill={belowFill} />

          {/* Horizon axis */}
          <line
            x1={xMinus90} y1={axisY}
            x2={x270}     y2={axisY}
            stroke={axisColor} strokeWidth="1"
          />

          {/* Background track */}
          <path
            d={trackPath}
            fill="none"
            stroke={trackColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Active progress trail */}
          {activePoints.length > 1 && (
            <path
              d={activePath}
              fill="none"
              stroke={activeColor}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Syuruk dot — sits on the axis, no leader line needed */}
          <g>
            <circle
              cx={sunriseDot.px} cy={sunriseDot.py} r={5}
              fill={sunriseDot.isPast ? prayerDotStroke : prayerDotFill}
              stroke={prayerDotStroke} strokeWidth="1.5"
            />
            <text
              x={sunriseDot.px + getLabelOffsetX("Syuruk")}
              y={sunriseDot.py + 16}
              textAnchor="middle" fontSize="8" fontFamily="inherit" fill={labelColor}
            >
              Syuruk
            </text>
          </g>

          {/* Maghrib dot — sits on the axis, no leader line needed */}
          <g>
            <circle
              cx={sunsetDot.px} cy={sunsetDot.py} r={5}
              fill={sunsetDot.isPast ? prayerDotStroke : prayerDotFill}
              stroke={prayerDotStroke} strokeWidth="1.5"
            />
            <text
              x={sunsetDot.px + getLabelOffsetX("Maghrib")}
              y={sunsetDot.py + 16}
              textAnchor="middle" fontSize="8" fontFamily="inherit" fill={labelColor}
            >
              Maghrib
            </text>
          </g>

          {/* Prayer dots */}
          {prayerDots.map(({ name, px, py, labelX, labelY, labelPos, isPast }) => (
            <g key={name}>
              {/* Leader line from dot down to axis */}
              <line
                x1={px} y1={py + (labelPos === "above" ? 5 : -5)}
                x2={px} y2={axisY}
                stroke={leaderColor} strokeWidth="1" strokeDasharray="2 2"
              />
              <circle
                cx={px} cy={py} r={5}
                fill={isPast ? prayerDotStroke : prayerDotFill}
                stroke={prayerDotStroke} strokeWidth="1.5"
              />
              <text
                x={labelX} y={labelY}
                textAnchor="middle" fontSize="8" fontFamily="inherit" fill={labelColor}
              >
                {name}
              </text>
            </g>
          ))}

          {/* Sun — rendered last so it's always on top */}
          <circle
            cx={sunX} cy={sunY} r={8}
            fill={sunColor}
            style={{ filter: `drop-shadow(0 0 5px ${sunGlow})` }}
          />
        </svg>
      </div>
    </div>
  );
}