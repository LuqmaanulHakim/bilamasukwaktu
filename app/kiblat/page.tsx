"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useTheme } from "../context/ThemeContext";
import { Loader2, AlertCircle, LocateFixed, RefreshCw, Compass } from "lucide-react";

const KAABAH_LAT = 21.4225;
const KAABAH_LON = 39.8262;

function toRad(deg: number) { return (deg * Math.PI) / 180; }
function toDeg(rad: number) { return (rad * 180) / Math.PI; }

function calcQiblaBearing(userLat: number, userLon: number): number {
  const dLon = toRad(KAABAH_LON - userLon);
  const lat1 = toRad(userLat);
  const lat2 = toRad(KAABAH_LAT);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Shortest angular difference, returns value in (-180, 180] */
function angleDiff(from: number, to: number) {
  let d = ((to - from) % 360 + 360) % 360;
  if (d > 180) d -= 360;
  return d;
}

type LocStatus = "idle" | "locating" | "success" | "error";

export default function KiblatPage() {
  const { theme } = useTheme();

  const [locStatus, setLocStatus] = useState<LocStatus>("idle");
  const [locError, setLocError] = useState<string | null>(null);
  const [qiblaBearing, setQiblaBearing] = useState<number | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [hasCompass, setHasCompass] = useState(false);
  const [compassPermission, setCompassPermission] = useState<"unknown" | "granted" | "denied">("unknown");
  const [alignState, setAlignState] = useState<"none" | "almost" | "aligned">("none");

  // DOM refs — rotations written directly, zero re-renders
  const dialRef    = useRef<SVGSVGElement>(null);
  const needleRef  = useRef<SVGSVGElement>(null);
  const glowRef    = useRef<SVGCircleElement>(null);

  // Sensor: raw heading from device (0–360, true north)
  const sensorHeadingRef = useRef<number | null>(null);

  // Continuous (unwrapped) smoothed angles — never reset, grow monotonically
  const smoothDialAngle   = useRef<number>(0);   // tracks -heading (dial rotates opposite)
  const smoothNeedleAngle = useRef<number>(0);   // tracks qibla - heading

  const qiblaRef = useRef<number | null>(null);
  const rafRef   = useRef<number | null>(null);

  // --- rAF loop ---
  const animate = useCallback(() => {
    rafRef.current = requestAnimationFrame(animate);

    const heading = sensorHeadingRef.current;
    const qibla   = qiblaRef.current;
    if (heading === null || qibla === null) return;

    // --- Dial: rotates to -heading (north stays up) ---
    const dialTarget = -heading;
    const dialDiff   = angleDiff(smoothDialAngle.current % 360, dialTarget);
    // Lerp on continuous angle (no wrap jump)
    smoothDialAngle.current += dialDiff * 0.15;
    if (dialRef.current) {
      dialRef.current.style.transform = `rotate(${smoothDialAngle.current}deg)`;
    }

    // --- Needle: rotates to (qibla - heading) ---
    const needleTarget = (qibla - heading + 360) % 360;
    const needleDiff   = angleDiff(smoothNeedleAngle.current % 360, needleTarget);
    smoothNeedleAngle.current += needleDiff * 0.15;
    if (needleRef.current) {
      needleRef.current.style.transform = `rotate(${smoothNeedleAngle.current}deg)`;
    }

    // --- Alignment glow ---
    // needleTarget is already (qibla - heading) in 0–360.
    // When the user faces qibla, needleTarget === 0 (needle points up).
    // So measure how far needleTarget is from 0°.
    const fromUp = needleTarget > 180 ? 360 - needleTarget : needleTarget;
    const newState = fromUp < 3 ? "aligned" : fromUp < 20 ? "almost" : "none";
    setAlignState(prev => prev !== newState ? newState : prev);
    if (glowRef.current) {
      glowRef.current.style.opacity = newState === "aligned" ? "0.15" : newState === "almost" ? "0.07" : "0";
    }
  }, []);

  // --- Compass ---
  const startCompass = useCallback(async () => {
    const DevOrEvent = (DeviceOrientationEvent as any);
    if (typeof DevOrEvent?.requestPermission === "function") {
      try {
        const perm = await DevOrEvent.requestPermission();
        if (perm !== "granted") { setCompassPermission("denied"); return; }
        setCompassPermission("granted");
      } catch { return; }
    } else {
      setCompassPermission("granted");
    }

    const handler = (e: DeviceOrientationEvent) => {
      // webkitCompassHeading: iOS true-north heading (0 = north, CW)
      // alpha: Android — 0 when pointing north, increases CCW, so we invert
      const raw =
        (e as any).webkitCompassHeading != null
          ? (e as any).webkitCompassHeading
          : e.alpha != null
          ? (360 - e.alpha) % 360
          : null;
      if (raw == null) return;
      setHasCompass(true);
      sensorHeadingRef.current = raw;
    };

    // deviceorientationabsolute is preferred (true north on Android)
    let gotAbsolute = false;
    const absHandler = (e: DeviceOrientationEvent) => {
      if (!(e as any).absolute) return;
      gotAbsolute = true;
      handler(e);
    };

    window.addEventListener("deviceorientationabsolute", absHandler as EventListener, true);
    // Fallback for iOS / devices without absolute
    const fallbackHandler = (e: DeviceOrientationEvent) => {
      if (!gotAbsolute) handler(e);
    };
    window.addEventListener("deviceorientation", fallbackHandler as EventListener, true);

    return () => {
      window.removeEventListener("deviceorientationabsolute", absHandler as EventListener, true);
      window.removeEventListener("deviceorientation", fallbackHandler as EventListener, true);
    };
  }, []);

  // --- Location ---
  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      setLocError("GPS tidak disokong oleh peranti anda.");
      setLocStatus("error");
      return;
    }
    setLocStatus("locating");
    setLocError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const bearing = calcQiblaBearing(latitude, longitude);
        const dist    = haversine(latitude, longitude, KAABAH_LAT, KAABAH_LON);
        setQiblaBearing(bearing);
        setDistanceKm(dist);
        qiblaRef.current = bearing;
        setLocStatus("success");
      },
      (err) => {
        const msgs: Record<number, string> = {
          1: "Kebenaran lokasi ditolak. Sila benarkan akses GPS.",
          2: "Lokasi tidak dapat dikesan.",
          3: "Masa tamat. Cuba lagi.",
        };
        setLocError(msgs[err.code] ?? "Ralat tidak diketahui.");
        setLocStatus("error");
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  useEffect(() => { locate(); }, [locate]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    rafRef.current = requestAnimationFrame(animate);
    let cleanupFn: (() => void) | undefined;
    if ("DeviceOrientationEvent" in window) {
      startCompass().then(fn => { cleanupFn = fn; });
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      cleanupFn?.();
    };
  }, [animate, startCompass]);

  const distanceLabel = distanceKm != null
    ? distanceKm >= 1000 ? `${(distanceKm / 1000).toFixed(1)}k km` : `${Math.round(distanceKm)} km`
    : null;

  return (
    <main className="w-full max-w-md mx-auto min-h-screen px-4 py-4 pb-24 space-y-4">
      {/* HEADER */}
      <section className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold mt-1">Kiblat</h1>
          <p className="mt-1 text-sm opacity-80">Arah solat menuju Kaabah</p>
        </div>
        <button
          onClick={locate}
          disabled={locStatus === "locating"}
          className="mt-1 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
          style={{ background: "var(--accent-subtle)", color: "var(--accent)", border: "1px solid var(--accent-border)" }}
        >
          {locStatus === "locating" ? <Loader2 size={13} className="animate-spin" /> : locStatus === "success" ? <RefreshCw size={13} /> : <LocateFixed size={13} />}
          {locStatus === "locating" ? "Mencari..." : "Kemas Kini"}
        </button>
      </section>

      {/* LOCATING */}
      {locStatus === "locating" && (
        <div className="rounded-2xl border p-8 flex flex-col items-center gap-4" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
          <Loader2 size={32} className="animate-spin" style={{ color: "var(--accent)" }} />
          <p className="text-sm opacity-60">Mendapatkan lokasi anda…</p>
        </div>
      )}

      {/* ERROR */}
      {locStatus === "error" && locError && (
        <div className="rounded-2xl border p-5 flex flex-col items-center text-center gap-3" style={{ background: "var(--accent-subtle)", borderColor: "var(--accent-border)" }}>
          <AlertCircle size={32} style={{ color: "var(--accent)" }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--accent)" }}>Ralat Lokasi</p>
            <p className="text-xs mt-1" style={{ color: "var(--accent)", opacity: 0.8 }}>{locError}</p>
          </div>
          <button onClick={locate} className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold" style={{ background: "var(--accent-border)", color: "var(--accent)" }}>
            <RefreshCw size={12} /> Cuba Lagi
          </button>
        </div>
      )}

      {/* COMPASS */}
      {locStatus === "success" && (
        <>
          <div className="rounded-2xl border p-6 flex flex-col items-center gap-5" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
            <div className="relative w-64 h-64 select-none">

              {/* Compass rose — rotates opposite to device heading */}
              <svg
                ref={dialRef}
                viewBox="0 0 256 256"
                className="absolute inset-0 w-full h-full"
                style={{ willChange: "transform", transformOrigin: "128px 128px" }}
              >
                <circle cx="128" cy="128" r="120" fill="var(--card-border)" opacity="0.4" />
                {Array.from({ length: 72 }).map((_, i) => {
                  const angle  = (i * 5 * Math.PI) / 180;
                  const isMajor = i % 6 === 0;
                  const r1 = isMajor ? 108 : 112;
                  return (
                    <line key={i}
                      x1={128 + r1 * Math.sin(angle)}   y1={128 - r1 * Math.cos(angle)}
                      x2={128 + 120 * Math.sin(angle)}  y2={128 - 120 * Math.cos(angle)}
                      stroke="var(--muted)"
                      strokeWidth={isMajor ? 2 : 1}
                      opacity={isMajor ? 0.6 : 0.3}
                    />
                  );
                })}
                {[{ label: "U", a: 0 }, { label: "T", a: 90 }, { label: "S", a: 180 }, { label: "B", a: 270 }].map(({ label, a }) => {
                  const rad = (a * Math.PI) / 180;
                  return (
                    <text key={label}
                      x={128 + 94 * Math.sin(rad)} y={128 - 94 * Math.cos(rad)}
                      textAnchor="middle" dominantBaseline="central"
                      fontSize="13" fontWeight="700"
                      fill={label === "U" ? "var(--accent)" : "var(--muted)"}
                      opacity={0.9}
                    >{label}</text>
                  );
                })}
              </svg>

              {/* Qibla needle — driven purely by rAF, NO css transition */}
              <svg
                ref={needleRef}
                viewBox="0 0 256 256"
                className="absolute inset-0 w-full h-full"
                style={{ willChange: "transform", transformOrigin: "128px 128px" }}
              >
                <circle ref={glowRef} cx="128" cy="128" r="64" fill="var(--accent)" opacity="0" />
                {/* Tip (points to qibla) */}
                <polygon points="128,32 120,60 136,60" fill="var(--accent)" />
                <rect x="126" y="60" width="4" height="64" rx="2" fill="var(--accent)" opacity="0.9" />
                {/* Tail */}
                <rect x="126" y="128" width="4" height="52" rx="2" fill="var(--muted)" opacity="0.35" />
                <polygon points="128,192 122,172 134,172" fill="var(--muted)" opacity="0.35" />
                {/* Hub */}
                <circle cx="128" cy="128" r="7" fill="var(--card-bg)" stroke="var(--accent)" strokeWidth="2.5" />
              </svg>

              {!hasCompass && (
                <div className="absolute inset-0 flex items-center justify-center" style={{ pointerEvents: "none" }}>
                  <Compass size={24} style={{ color: "var(--muted)", opacity: 0.4 }} />
                </div>
              )}
            </div>

            <div className="text-center">
              {alignState === "aligned" ? (
                <p className="text-sm font-bold" style={{ color: "var(--accent)" }}>✓ Tepat menghadap Kiblat</p>
              ) : alignState === "almost" ? (
                <p className="text-sm font-semibold" style={{ color: "var(--accent)", opacity: 0.8 }}>Hampir tepat — putar sedikit lagi</p>
              ) : (
                <p className="text-sm opacity-60">Hadapkan anak panah ke arah solat anda</p>
              )}
            </div>
          </div>

          {/* Info cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border p-4 flex flex-col gap-1" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
              <p className="text-xs font-semibold opacity-50 uppercase tracking-wide">Arah Kiblat</p>
              <p className="text-lg font-bold" style={{ color: "var(--accent)" }}>{qiblaBearing != null ? `${qiblaBearing.toFixed(1)}°` : "—"}</p>
              <p className="text-[11px] opacity-50">dari Utara (CW)</p>
            </div>
            <div className="rounded-2xl border p-4 flex flex-col gap-1" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
              <p className="text-xs font-semibold opacity-50 uppercase tracking-wide">Jarak ke Kaabah</p>
              <p className="text-lg font-bold" style={{ color: "var(--accent)" }}>{distanceLabel ?? "—"}</p>
              <p className="text-[11px] opacity-50">kilometer</p>
            </div>
          </div>

          {/* No compass notice */}
          {!hasCompass && compassPermission !== "denied" && (
            <div className="rounded-2xl border p-4 flex items-start gap-3" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
              <Compass size={18} style={{ color: "var(--accent)" }} className="shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">Kompas Peranti</p>
                <p className="text-xs opacity-60 mt-0.5">Kompas automatik tidak tersedia. Gunakan nilai bearing di atas sebagai panduan arah dari Utara.</p>
                {typeof (DeviceOrientationEvent as any)?.requestPermission === "function" && (
                  <button onClick={startCompass} className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                    style={{ background: "var(--accent-subtle)", color: "var(--accent)", border: "1px solid var(--accent-border)" }}>
                    <Compass size={11} /> Aktifkan Kompas
                  </button>
                )}
              </div>
            </div>
          )}

          {compassPermission === "denied" && (
            <div className="rounded-2xl border p-4 flex items-start gap-3" style={{ background: "var(--accent-subtle)", borderColor: "var(--accent-border)" }}>
              <AlertCircle size={18} style={{ color: "var(--accent)" }} className="shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--accent)" }}>Kebenaran Kompas Ditolak</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--accent)", opacity: 0.8 }}>Sila benarkan akses sensor gerakan dalam tetapan pelayar anda.</p>
              </div>
            </div>
          )}

          <div className="rounded-2xl border p-4 space-y-2" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
            <p className="text-xs font-bold uppercase tracking-wide opacity-50">Cara Penggunaan</p>
            <ol className="text-xs space-y-1.5 opacity-70 list-decimal list-inside">
              <li>Pegang telefon rata (mendatar) di hadapan anda</li>
              <li>Pusing badan hingga anak panah menunjuk ke atas</li>
              <li>Anda kini menghadap Kiblat</li>
            </ol>
          </div>
        </>
      )}

      {locStatus === "idle" && (
        <div className="rounded-2xl border p-8 flex flex-col items-center gap-4 text-center" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
          <Compass size={40} style={{ color: "var(--accent)", opacity: 0.5 }} />
          <p className="text-sm font-semibold">Mendapatkan lokasi…</p>
          <p className="text-xs opacity-50">Sila benarkan akses GPS</p>
        </div>
      )}
    </main>
  );
}