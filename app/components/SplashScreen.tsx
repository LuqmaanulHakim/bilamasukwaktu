"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";

export default function SplashScreen() {
  const [visible, setVisible]   = useState(true);
  const [fadeOut, setFadeOut]   = useState(false);
  const [progress, setProgress] = useState(0);

  const DURATION = 3600;

  useEffect(() => {
    const start = performance.now();
    let frame: number;
    const tick = (now: number) => {
      const p = Math.min((now - start) / DURATION, 1);
      setProgress(p);
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    const t1 = setTimeout(() => setFadeOut(true),   DURATION + 200);
    const t2 = setTimeout(() => setVisible(false),  DURATION + 900);
    return () => { cancelAnimationFrame(frame); clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (!visible) return null;

  // ─── Arc geometry ───────────────────────────────────────────────
  const W = 300, H = 160, cx = W / 2, cy = H - 20, rx = 110, ry = 100;

  function angleToXY(a: number): [number, number] {
    return [cx - rx * Math.cos(a), cy - ry * Math.sin(a)];
  }
  function arcPath(from: number, to: number, steps = 80): string {
    return Array.from({ length: steps + 1 }, (_, i) => {
      const a = from + (to - from) * (i / steps);
      const [x, y] = angleToXY(a);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    }).join(" ");
  }

  const sunAngle  = progress * Math.PI;
  const [sunX, sunY] = angleToXY(sunAngle);
  const fullArc   = arcPath(0, Math.PI);
  const activeArc = arcPath(0, sunAngle);

  // ─── Color helpers ───────────────────────────────────────────────
  type RGB = [number, number, number];

  function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
  function lerpRGB(a: RGB, b: RGB, t: number): RGB {
    return [Math.round(lerp(a[0], b[0], t)), Math.round(lerp(a[1], b[1], t)), Math.round(lerp(a[2], b[2], t))];
  }
  function rgb([r, g, b]: RGB, a = 1) { return `rgba(${r},${g},${b},${a})`; }

  function sample<T extends { p: number }>(
    frames: (T & { p: number })[],
    p: number,
    get: (a: T, b: T, t: number) => Omit<T, "p">,
  ): Omit<T, "p"> {
    for (let i = 0; i < frames.length - 1; i++) {
      const a = frames[i], b = frames[i + 1];
      if (p >= a.p && p <= b.p) return get(a, b, (p - a.p) / (b.p - a.p));
    }
    return frames[frames.length - 1];
  }

  // ─── Sky keyframes ───────────────────────────────────────────────
  // Using individual stop colors avoids iOS gradient interpolation bugs
  const skyFrames: { p: number; top: RGB; bot: RGB }[] = [
    { p: 0.00, top: [8,   10,  26],  bot: [15,  18,  45]  }, // night
    { p: 0.12, top: [28,  18,  52],  bot: [90,  45,  35]  }, // pre-dawn
    { p: 0.20, top: [55,  30,  60],  bot: [200, 100, 60]   }, // dawn orange
    { p: 0.35, top: [100, 140, 200], bot: [255, 220, 150]  }, // early morning
    { p: 0.50, top: [70,  130, 200], bot: [180, 220, 255]  }, // midday ← fixed blue
    { p: 0.65, top: [100, 140, 200], bot: [255, 210, 140]  }, // afternoon
    { p: 0.80, top: [55,  30,  60],  bot: [200, 80,  40]   }, // dusk
    { p: 0.90, top: [28,  18,  52],  bot: [70,  30,  20]   }, // post-dusk
    { p: 1.00, top: [8,   10,  26],  bot: [15,  18,  45]   }, // night
  ];

  const sky = sample(skyFrames, progress, (a, b, t) => ({
    top: lerpRGB(a.top, b.top, t),
    bot: lerpRGB(a.bot, b.bot, t),
  })) as { top: RGB; bot: RGB };

  // ─── Sun color ───────────────────────────────────────────────────
  const sunFrames: { p: number; c: RGB }[] = [
    { p: 0.00, c: [60,  60,  100] },
    { p: 0.15, c: [230, 100, 40]  },
    { p: 0.30, c: [250, 180, 60]  },
    { p: 0.50, c: [255, 215, 80]  },
    { p: 0.70, c: [250, 160, 50]  },
    { p: 0.85, c: [220, 80,  30]  },
    { p: 1.00, c: [60,  60,  100] },
  ];

  const sunRGB = (sample(sunFrames, progress, (a, b, t) => ({
    c: lerpRGB(a.c, b.c, t),
  })) as { c: RGB }).c;

  const sunColor = rgb(sunRGB);
  const sunGlow  = rgb(sunRGB, 0.3);
  const arcAlpha = progress < 0.1 ? progress * 10 : progress > 0.9 ? (1 - progress) * 10 : 1;
  const arcColor = rgb(sunRGB, Math.min(arcAlpha, 1) * 0.85);

  // ─── Adaptive colors ─────────────────────────────────────────────
  const isBright      = progress > 0.28 && progress < 0.72;
  const horizonColor  = isBright ? "rgba(0,0,0,0.15)"  : "rgba(255,255,255,0.12)";
  const trackColor    = isBright ? "rgba(0,0,0,0.10)"  : "rgba(255,255,255,0.10)";
  const labelColor    = isBright ? "rgba(0,0,0,0.45)"  : "rgba(255,255,255,0.45)";
  const textColor     = isBright ? "rgba(0,0,0,0.80)"  : "rgba(255,255,255,0.92)";
  const logoFilter    = isBright
    ? "invert(1) brightness(0.25)"
    : "brightness(1.1) drop-shadow(0 0 10px rgba(255,200,80,0.35))";

  // ─── Text opacity ─────────────────────────────────────────────────
  const textOpacity =
    progress < 0.25 ? 0
    : progress < 0.40 ? (progress - 0.25) / 0.15
    : progress < 0.80 ? 1
    : progress < 0.92 ? 1 - (progress - 0.80) / 0.12
    : 0;

  // ─── Stars ───────────────────────────────────────────────────────
  const starsOpacity =
    progress < 0.10 ? 1
    : progress < 0.25 ? 1 - (progress - 0.10) / 0.15
    : progress < 0.75 ? 0
    : progress < 0.88 ? (progress - 0.75) / 0.13
    : 1;

  const stars: [number, number, number][] = [
    [8, 12, 1.4], [22, 6, 1], [46, 18, 1.2], [68, 8, 0.9],
    [82, 22, 1.4], [90, 13, 1], [14, 35, 0.8], [62, 32, 0.8],
  ];

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-700 ${fadeOut ? "opacity-0" : "opacity-100"}`}
      style={{
        // Two-stop gradient rebuilt each frame — use explicit pixel values for iOS Safari
        background: `linear-gradient(to bottom, rgb(${sky.top[0]},${sky.top[1]},${sky.top[2]}), rgb(${sky.bot[0]},${sky.bot[1]},${sky.bot[2]}))`,
      }}
    >
      {/* Stars layer */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{ opacity: starsOpacity }}
      >
        {stars.map(([xPct, yPct, r], i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{ left: `${xPct}%`, top: `${yPct}%`, width: r * 2, height: r * 2, opacity: 0.7 }}
          />
        ))}
      </div>

      {/* Sun arc */}
      <div className="relative w-full flex justify-center" style={{ maxWidth: W }}>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible", maxWidth: W }}>
          {/* Horizon */}
          <line x1={cx - rx - 20} y1={cy} x2={cx + rx + 20} y2={cy} stroke={horizonColor} strokeWidth="1" />

          {/* Glow + sun */}
          <circle cx={sunX} cy={sunY} r={24} fill={sunGlow} />
          <circle cx={sunX} cy={sunY} r={9}  fill={sunColor} />
        </svg>
      </div>

      {/* Logo + text */}
      <div
        className="flex flex-col items-center gap-3 mt-2"
        style={{ opacity: textOpacity, transform: `translateY(${(1 - textOpacity) * 8}px)` }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-px" style={{ background: rgb(sunRGB, 0.45) }} />
          <div className="w-1 h-1 rounded-full" style={{ background: rgb(sunRGB, 0.65) }} />
          <div className="w-10 h-px" style={{ background: rgb(sunRGB, 0.45) }} />
        </div>

        <Image
          src="/icon_bmw.png"
          alt="App Logo"
          width={72}
          height={72}
          priority
          className="object-contain"
          style={{ filter: logoFilter }}
        />

        <div className="flex flex-col items-center gap-1">
          <h1
            className="text-xl font-light tracking-[0.3em] uppercase m-0"
            style={{ color: textColor, fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            Bila Masuk Waktu
          </h1>
        </div>
      </div>

      {/* Progress bar */}
      <div
        className="absolute bottom-14 left-1/2 -translate-x-1/2 rounded-full overflow-hidden"
        style={{ width: 100, height: 1, background: isBright ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)" }}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${(progress * 100).toFixed(1)}%`, background: arcColor }}
        />
      </div>
    </div>
  );
}