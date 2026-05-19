"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [progress, setProgress] = useState(0); // 0 → 1 over the animation

  // Total splash duration
  const DURATION = 2800;

  useEffect(() => {
    const start = performance.now();

    let frame: number;
    const tick = (now: number) => {
      const elapsed = now - start;
      const p = Math.min(elapsed / DURATION, 1);
      setProgress(p);
      if (p < 1) {
        frame = requestAnimationFrame(tick);
      }
    };
    frame = requestAnimationFrame(tick);

    const t1 = setTimeout(() => setFadeOut(true), DURATION + 200);
    const t2 = setTimeout(() => setVisible(false), DURATION + 900);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (!visible) return null;

  // --- Arc geometry (same as SunTimeline) ---
  const W  = 300;
  const H  = 160;
  const cx = W / 2;
  const cy = H - 20;
  const rx = 110;
  const ry = 100;

  function angleToXY(angle: number): [number, number] {
    return [
      cx - rx * Math.cos(angle),
      cy - ry * Math.sin(angle),
    ];
  }

  // Sun travels from angle 0 (left/sunrise) → π (right/sunset)
  // progress 0→0.1: pre-dawn (sun below left horizon)
  // progress 0.1→0.9: sunrise → sunset arc
  // progress 0.9→1: post-dusk
  const sunAngle = progress * Math.PI; // 0 → π
  const [sunX, sunY] = angleToXY(sunAngle);

  // Arc path
  function arcPath(fromA: number, toA: number, steps = 80): string {
    const pts: string[] = [];
    for (let i = 0; i <= steps; i++) {
      const a = fromA + (toA - fromA) * (i / steps);
      const [x, y] = angleToXY(a);
      pts.push(i === 0 ? `M ${x.toFixed(2)} ${y.toFixed(2)}` : `L ${x.toFixed(2)} ${y.toFixed(2)}`);
    }
    return pts.join(" ");
  }

  const fullArc   = arcPath(0, Math.PI);
  const activeArc = arcPath(0, sunAngle);

  // --- Sky color interpolation based on progress ---
  // Keyframes: night → dawn → day → dusk → night
  type RGB = [number, number, number];

  function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
  }

  function lerpRGB(c1: RGB, c2: RGB, t: number): RGB {
    return [
      Math.round(lerp(c1[0], c2[0], t)),
      Math.round(lerp(c1[1], c2[1], t)),
      Math.round(lerp(c1[2], c2[2], t)),
    ];
  }

  function toCSS([r, g, b]: RGB, a = 1) {
    return `rgba(${r},${g},${b},${a})`;
  }

  // Sky gradient top/bottom keyframes at progress points
  const skyKeyframes: { p: number; top: RGB; bot: RGB }[] = [
    { p: 0.00, top: [8,  10, 26],  bot: [15, 18, 45]  }, // deep night
    { p: 0.12, top: [28, 18, 52],  bot: [90, 45, 35]  }, // pre-dawn purple
    { p: 0.20, top: [55, 30, 60],  bot: [200,100, 60]  }, // dawn orange
    { p: 0.35, top: [100,140,200], bot: [255,220,150]  }, // early morning
    { p: 0.50, top: [80, 140,210], bot: [200,230,255]  }, // midday blue
    { p: 0.65, top: [100,140,200], bot: [255,220,150]  }, // afternoon
    { p: 0.80, top: [55, 30, 60],  bot: [200, 80, 40]  }, // dusk
    { p: 0.90, top: [28, 18, 52],  bot: [70,  30, 20]  }, // post-dusk
    { p: 1.00, top: [8,  10, 26],  bot: [15, 18, 45]  }, // night again
  ];

  function getSkyColor(p: number): { top: RGB; bot: RGB } {
    for (let i = 0; i < skyKeyframes.length - 1; i++) {
      const a = skyKeyframes[i];
      const b = skyKeyframes[i + 1];
      if (p >= a.p && p <= b.p) {
        const t = (p - a.p) / (b.p - a.p);
        return { top: lerpRGB(a.top, b.top, t), bot: lerpRGB(a.bot, b.bot, t) };
      }
    }
    return { top: skyKeyframes[0].top, bot: skyKeyframes[0].bot };
  }

  const sky = getSkyColor(progress);

  // Sun color: deep orange at dawn/dusk, bright amber midday, dim at night edges
  const sunColorKeyframes: { p: number; c: RGB }[] = [
    { p: 0.00, c: [60,  60, 100]  }, // night — bluish dim
    { p: 0.15, c: [230, 100, 40]  }, // dawn — deep orange
    { p: 0.30, c: [250, 180, 60]  }, // morning — warm gold
    { p: 0.50, c: [255, 210, 80]  }, // midday — bright
    { p: 0.70, c: [250, 160, 50]  }, // afternoon
    { p: 0.85, c: [220,  80, 30]  }, // dusk — red-orange
    { p: 1.00, c: [60,  60, 100]  }, // night again
  ];

  function getSunColor(p: number): RGB {
    for (let i = 0; i < sunColorKeyframes.length - 1; i++) {
      const a = sunColorKeyframes[i];
      const b = sunColorKeyframes[i + 1];
      if (p >= a.p && p <= b.p) {
        const t = (p - a.p) / (b.p - a.p);
        return lerpRGB(a.c, b.c, t);
      }
    }
    return sunColorKeyframes[0].c;
  }

  const sunRGB   = getSunColor(progress);
  const sunColor = toCSS(sunRGB);
  const sunGlow  = toCSS(sunRGB, 0.35);

  // Arc active color
  const arcAlpha = progress < 0.1 ? progress * 5 : progress > 0.9 ? (1 - progress) * 10 : 1;
  const arcColor = toCSS(sunRGB, arcAlpha * 0.8);

  // Text fade: appear around progress 0.3, hold, fade at 0.85
  const textOpacity =
    progress < 0.25 ? 0
    : progress < 0.40 ? (progress - 0.25) / 0.15
    : progress < 0.80 ? 1
    : progress < 0.92 ? 1 - (progress - 0.80) / 0.12
    : 0;

  // Horizon & track colors adapt to sky brightness
  const isBright = progress > 0.25 && progress < 0.75;
  const horizonColor = isBright ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.12)";
  const trackColor   = isBright ? "rgba(0,0,0,0.10)" : "rgba(255,255,255,0.10)";
  const labelColor   = isBright ? "rgba(0,0,0,0.4)"  : "rgba(255,255,255,0.4)";

  // Logo filter: invert when sky is bright so it stays visible
  const logoFilter = isBright
    ? "invert(1) brightness(0.3)"
    : "brightness(1.1) drop-shadow(0 0 12px rgba(255,200,80,0.3))";

  // Star dots (simple, fade out as day comes, back at dusk)
  const starsOpacity =
    progress < 0.10 ? 1
    : progress < 0.25 ? 1 - (progress - 0.10) / 0.15
    : progress < 0.75 ? 0
    : progress < 0.88 ? (progress - 0.75) / 0.13
    : 1;

  const stars: [number, number, number][] = [
    [30, 18, 1.5], [80, 10, 1], [140, 22, 1.2], [210, 8, 1],
    [255, 25, 1.5], [270, 14, 1], [40, 40, 0.8], [190, 38, 0.8],
  ];

  return (
    <div
      className={`
        fixed inset-0 z-[9999] flex flex-col items-center justify-center
        transition-opacity duration-700
        ${fadeOut ? "opacity-0" : "opacity-100"}
      `}
      style={{
        background: `linear-gradient(to bottom, ${toCSS(sky.top)}, ${toCSS(sky.bot)})`,
        transition: fadeOut
          ? "opacity 700ms ease"
          : "background 80ms linear",
      }}
    >
      {/* Stars */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ opacity: starsOpacity, transition: "opacity 300ms ease" }}
      >
        {stars.map(([x, y, r], i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: `${x / 3}%`,
              top: `${y}%`,
              width: r * 2,
              height: r * 2,
            }}
          />
        ))}
      </div>

      {/* Sun arc SVG */}
      <div className="relative w-full flex justify-center" style={{ maxWidth: 300 }}>
        <svg
          width="100%"
          viewBox={`0 0 ${W} ${H}`}
          style={{ overflow: "visible", maxWidth: W }}
        >
          {/* Horizon */}
          <line
            x1={cx - rx - 20} y1={cy}
            x2={cx + rx + 20} y2={cy}
            stroke={horizonColor} strokeWidth="1"
          />

          {/* Active arc */}
          {progress > 0.01 && (
            <path
              d={activeArc}
              fill="none"
              stroke={arcColor}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          )}

          {/* Sun glow */}
          <circle cx={sunX} cy={sunY} r={22} fill={sunGlow} />

          {/* Sun disk */}
          <circle cx={sunX} cy={sunY} r={9} fill={sunColor} />
        </svg>
      </div>

      {/* Logo + text */}
      <div
        className="flex flex-col items-center gap-3 mt-2"
        style={{
          opacity: textOpacity,
          transform: `translateY(${(1 - textOpacity) * 8}px)`,
          transition: "none",
        }}
      >
        {/* Divider */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-10 h-px"
            style={{ background: toCSS(sunRGB, 0.45) }}
          />
          <div
            className="w-1 h-1 rounded-full"
            style={{ background: toCSS(sunRGB, 0.65) }}
          />
          <div
            className="w-10 h-px"
            style={{ background: toCSS(sunRGB, 0.45) }}
          />
        </div>

        {/* Logo */}
        <Image
          src="/icon_bmw.png"
          alt="App Logo"
          width={72}
          height={72}
          priority
          className="object-contain"
          style={{ filter: logoFilter, transition: "filter 400ms ease" }}
        />

        {/* App name */}
        <div className="flex flex-col items-center gap-1">
          <h1
            className="text-xl font-light tracking-[0.3em] uppercase"
            style={{
              color: isBright ? "rgba(0,0,0,0.75)" : "rgba(255,255,255,0.9)",
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              transition: "color 300ms ease",
            }}
          >
            Bila Masuk Waktu
          </h1>
        </div>
      </div>

      {/* Progress bar */}
      <div
        className="absolute bottom-14 left-1/2 -translate-x-1/2 rounded-full overflow-hidden"
        style={{
          width: 100,
          height: 1,
          background: isBright ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)",
        }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${(progress * 100).toFixed(1)}%`,
            background: arcColor,
          }}
        />
      </div>
    </div>
  );
}