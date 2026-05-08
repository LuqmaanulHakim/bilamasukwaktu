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

  // Helper function to format time without seconds
  function formatTimeWithoutSeconds(time: string) {
    return time.split(":").slice(0, 2).join(":");
  }

  const sunrise = convertToHour(data.syuruk);
  const sunset  = convertToHour(data.maghrib);
  const progress = (currentHour - sunrise) / (sunset - sunrise);
  const safeProgress = Math.max(0, Math.min(1, progress));

  const svgW   = 320;
  const svgH   = 200;
  const padX   = 20;
  const axisY  = 130;
  const amp    = 100;
  const dipAmp = 38;
  const totalSpan = 360;
  const visW = svgW - 2 * padX;

  function degToX(deg: number) {
    return padX + ((deg + 90) / totalSpan) * visW;
  }

  function degToY(deg: number) {
    const s = Math.sin((deg * Math.PI) / 180);
    return axisY - (s > 0 ? s * amp : s * dipAmp);
  }

  // Map any clock hour → degree on the sine curve
  // sunrise = 0°, sunset = 180°, outside that range extrapolates into the dip zones
  function hourToDeg(hour: number) {
    return ((hour - sunrise) / (sunset - sunrise)) * 180;
  }

  const xMinus90 = degToX(-90);
  const x0       = degToX(0);
  const x180     = degToX(180);
  const x270     = degToX(270);

  const sunDeg = safeProgress * 180;
  const sunX   = degToX(sunDeg);
  const sunY   = degToY(sunDeg);

  const steps = 400;
  const allPoints: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const deg = -90 + (360 * i) / steps;
    allPoints.push([degToX(deg), degToY(deg)]);
  }

  const startIdx = Math.round(steps / 4);
  const endIdx   = Math.round((steps * 3) / 4);
  const sunIdx   = Math.round(startIdx + safeProgress * (endIdx - startIdx));

  const activePoints = allPoints.slice(startIdx, sunIdx + 1);

  function toSmoothPath(pts: [number, number][], tension = 0.4) {
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

  const subsample = (pts: [number, number][], n: number) =>
    pts.filter((_, i) => i % n === 0 || i === pts.length - 1);

  const trackPath  = toSmoothPath(subsample(allPoints, 4));
  const activePath = toSmoothPath(subsample(activePoints, 4));

  const leftDipPts      = allPoints.slice(0, startIdx + 1);
  const rightDipPts     = allPoints.slice(endIdx);
  const leftDipPath     = `${toSmoothPath(subsample(leftDipPts, 4))} L ${x0} ${axisY} L ${xMinus90} ${axisY} Z`;
  const rightDipPath    = `${toSmoothPath(subsample(rightDipPts, 4))} L ${x270} ${axisY} L ${x180} ${axisY} Z`;

  // Prayer dots — each mapped onto the curve by hour
  // label position: "above" for prayers during daylight (on the arc), "below" for outside
  const prayerDots = [
    { name: "Subuh", hour: convertToHour(data.fajr),    labelPos: "below" as const },
    { name: "Zohor", hour: convertToHour(data.dhuhr),   labelPos: "above" as const },
    { name: "Asar",  hour: convertToHour(data.asr),     labelPos: "above" as const },
    { name: "Isya",  hour: convertToHour(data.isha),    labelPos: "below" as const },
  ].map(({ name, hour, labelPos }) => {
    const deg = hourToDeg(hour);
    const px  = degToX(deg);
    const py  = degToY(deg);
    const isPast = hour <= currentHour;
    return { name, px, py, labelPos, isPast };
  });

  // Sunrise and sunset as prayer-like dots
  const sunriseDot = {
    name: "Syuruk",
    hour: sunrise,
    px: x0,
    py: axisY,
    isPast: sunrise <= currentHour
  };
  
  const sunsetDot = {
    name: "Maghrib",
    hour: sunset,
    px: x180,
    py: axisY,
    isPast: sunset <= currentHour
  };

  const axisColor   = isDark ? "#475569" : "#94a3b8";
  const trackColor  = isDark ? "#334155" : "#e2e8f0";
  const activeColor = isDark ? "#93c5fd" : "#3b82f6";
  const sunColor    = isDark ? "#93c5fd" : "#f59e0b";
  const labelColor  = isDark ? "#64748b" : "#94a3b8";
  const belowFill   = isDark ? "rgba(51,65,85,0.2)" : "rgba(226,232,240,0.35)";

  // Prayer dot colors
  const prayerDotFill   = isDark ? "#1e293b" : "#ffffff";
  const prayerDotStroke = isDark ? "#93c5fd" : "#3b82f6";
  const prayerDotPast   = isDark ? "#334155" : "#e2e8f0";

  return (
    <div
      className="rounded-3xl p-6 shadow-sm border"
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
          {/* Below-axis shaded dip zones */}
          <path d={leftDipPath}  fill={belowFill} />
          <path d={rightDipPath} fill={belowFill} />

          {/* X-axis */}
          <line
            x1={xMinus90} y1={axisY}
            x2={x270}     y2={axisY}
            stroke={axisColor} strokeWidth="1"
          />

          {/* Full background curve */}
          <path
            d={trackPath}
            fill="none"
            stroke={trackColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Active progress curve */}
          {safeProgress > 0 && subsample(activePoints, 4).length > 1 && (
            <path
              d={activePath}
              fill="none"
              stroke={activeColor}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Sunrise dot - styled like prayer dots */}
          <g>
            <line
              x1={sunriseDot.px} y1={sunriseDot.py + 5}
              x2={sunriseDot.px} y2={axisY}
              stroke={isDark ? "#334155" : "#e2e8f0"}
              strokeWidth="1"
              strokeDasharray="2 2"
            />
            <circle
              cx={sunriseDot.px} cy={sunriseDot.py} r={5}
              fill={sunriseDot.isPast ? prayerDotStroke : prayerDotFill}
              stroke={prayerDotStroke}
              strokeWidth="1.5"
            />
            <text
              x={sunriseDot.px} y={sunriseDot.py + 18}
              textAnchor="middle"
              fontSize="8"
              fontFamily="inherit"
              fill={labelColor}
            >
              {sunriseDot.name}
            </text>
          </g>

          {/* Sunset dot - styled like prayer dots */}
          <g>
            <line
              x1={sunsetDot.px} y1={sunsetDot.py + 5}
              x2={sunsetDot.px} y2={axisY}
              stroke={isDark ? "#334155" : "#e2e8f0"}
              strokeWidth="1"
              strokeDasharray="2 2"
            />
            <circle
              cx={sunsetDot.px} cy={sunsetDot.py} r={5}
              fill={sunsetDot.isPast ? prayerDotStroke : prayerDotFill}
              stroke={prayerDotStroke}
              strokeWidth="1.5"
            />
            <text
              x={sunsetDot.px} y={sunsetDot.py + 18}
              textAnchor="middle"
              fontSize="8"
              fontFamily="inherit"
              fill={labelColor}
            >
              {sunsetDot.name}
            </text>
          </g>

          {/* Prayer dots */}
          {prayerDots.map(({ name, px, py, labelPos, isPast }) => {
            const labelY = labelPos === "above" ? py - 12 : py + 18;
            return (
              <g key={name}>
                {/* Vertical leader line from dot to axis */}
                <line
                  x1={px} y1={py + (labelPos === "above" ? 5 : -5)}
                  x2={px} y2={axisY}
                  stroke={isDark ? "#334155" : "#e2e8f0"}
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
                {/* Dot — filled ring style */}
                <circle
                  cx={px} cy={py} r={5}
                  fill={isPast ? prayerDotStroke : prayerDotFill}
                  stroke={prayerDotStroke}
                  strokeWidth="1.5"
                />
                {/* Label */}
                <text
                  x={px} y={labelY}
                  textAnchor="middle"
                  fontSize="8"
                  fontFamily="inherit"
                  fill={labelColor}
                >
                  {name}
                </text>
              </g>
            );
          })}

          {/* Moving sun — rendered last so it's on top */}
          <circle
            cx={sunX} cy={sunY} r={8}
            fill={sunColor}
            style={{
              filter: `drop-shadow(0 0 5px ${
                isDark ? "rgba(147,197,253,0.5)" : "rgba(245,158,11,0.5)"
              })`
            }}
          />
        </svg>
      </div>

      <div className="flex justify-between mt-3 text-sm">
        <div>
          <p style={{ color: "var(--muted)" }}>Syuruk</p>
          <p className="font-medium" style={{ color: "var(--foreground)" }}>{formatTimeWithoutSeconds(data.syuruk)}</p>
        </div>
        <div className="text-right">
          <p style={{ color: "var(--muted)" }}>Maghrib</p>
          <p className="font-medium" style={{ color: "var(--foreground)" }}>{formatTimeWithoutSeconds(data.maghrib)}</p>
        </div>
      </div>
    </div>
  );
}