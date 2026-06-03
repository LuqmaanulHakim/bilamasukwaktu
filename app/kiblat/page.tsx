"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useTheme } from "../context/ThemeContext";
import { Loader2, AlertCircle, LocateFixed, RefreshCw, Compass } from "lucide-react";

// Kaabah coordinates
const KAABAH_LAT = 21.4225;
const KAABAH_LON = 39.8262;

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function toDeg(rad: number) {
  return (rad * 180) / Math.PI;
}

/** Returns bearing in degrees (0–360) from user toward Kaabah */
function calcQiblaBearing(userLat: number, userLon: number): number {
  const dLon = toRad(KAABAH_LON - userLon);
  const lat1 = toRad(userLat);
  const lat2 = toRad(KAABAH_LAT);

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/** Haversine distance in km */
function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

type LocStatus = "idle" | "locating" | "success" | "error";

export default function KiblatPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Location state
  const [locStatus, setLocStatus] = useState<LocStatus>("idle");
  const [locError, setLocError] = useState<string | null>(null);
  const [qiblaBearing, setQiblaBearing] = useState<number | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);

  // Compass state
  const [heading, setHeading] = useState<number | null>(null); // device heading (deg from north)
  const [compassError, setCompassError] = useState<string | null>(null);
  const [hasCompass, setHasCompass] = useState(false);
  const [compassPermission, setCompassPermission] = useState<"unknown" | "granted" | "denied">("unknown");

  // Smoothing ref
  const smoothRef = useRef<number | null>(null);
  const displayHeadingRef = useRef<number>(0);
  const [displayHeading, setDisplayHeading] = useState(0);

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
        const dist = haversine(latitude, longitude, KAABAH_LAT, KAABAH_LON);
        setQiblaBearing(bearing);
        setDistanceKm(dist);
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

  useEffect(() => {
    locate();
  }, [locate]);

  // --- Compass ---
  const startCompass = useCallback(async () => {
    // iOS 13+ requires permission
    const DevOrEvent = (DeviceOrientationEvent as any);
    if (typeof DevOrEvent?.requestPermission === "function") {
      try {
        const perm = await DevOrEvent.requestPermission();
        if (perm !== "granted") {
          setCompassPermission("denied");
          setCompassError("Kebenaran kompas ditolak.");
          return;
        }
        setCompassPermission("granted");
      } catch {
        setCompassError("Tidak dapat meminta kebenaran kompas.");
        return;
      }
    } else {
      setCompassPermission("granted");
    }

    const handler = (e: DeviceOrientationEvent) => {
      // webkitCompassHeading is iOS, alpha is Android (0 = north, increases CW)
      const raw =
        (e as any).webkitCompassHeading != null
          ? (e as any).webkitCompassHeading
          : e.alpha != null
          ? (360 - e.alpha) % 360
          : null;

      if (raw == null) return;
      setHasCompass(true);

      // Smooth heading with low-pass filter
      if (smoothRef.current === null) {
        smoothRef.current = raw;
        displayHeadingRef.current = raw;
      } else {
        // Handle wraparound (e.g. 359 → 1)
        let diff = raw - smoothRef.current!;
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;
        smoothRef.current = (smoothRef.current! + diff * 0.15 + 360) % 360;
      }
      setHeading(smoothRef.current);
      setDisplayHeading(smoothRef.current!);
    };

    window.addEventListener("deviceorientationabsolute", handler as EventListener, true);
    window.addEventListener("deviceorientation", handler as EventListener, true);

    return () => {
      window.removeEventListener("deviceorientationabsolute", handler as EventListener, true);
      window.removeEventListener("deviceorientation", handler as EventListener, true);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("DeviceOrientationEvent" in window) {
      const cleanup = startCompass();
      return () => {
        cleanup?.then?.((fn) => fn?.());
      };
    } else {
      setCompassError("Kompas tidak disokong oleh peranti ini.");
    }
  }, [startCompass]);

  // --- Derived values ---
  // needleAngle = qibla direction relative to current device heading
  const needleAngle =
    qiblaBearing != null && heading != null
      ? (qiblaBearing - heading + 360) % 360
      : null;

  // How aligned is the user? 0 = perfect, used for glow intensity
  const alignDelta =
    needleAngle != null ? Math.min(Math.abs(needleAngle), Math.abs(360 - needleAngle)) : 180;
  const isAligned = alignDelta < 5;
  const almostAligned = alignDelta < 20;

  const bearingLabel =
    qiblaBearing != null
      ? `${qiblaBearing.toFixed(1)}° dari Utara`
      : null;

  const distanceLabel =
    distanceKm != null
      ? distanceKm >= 1000
        ? `${(distanceKm / 1000).toFixed(1)}k km`
        : `${Math.round(distanceKm)} km`
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
          aria-label="Refresh lokasi"
          className="mt-1 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
          style={{
            background: "var(--accent-subtle)",
            color: "var(--accent)",
            border: "1px solid var(--accent-border)",
          }}
        >
          {locStatus === "locating" ? (
            <Loader2 size={13} className="animate-spin" />
          ) : locStatus === "success" ? (
            <RefreshCw size={13} />
          ) : (
            <LocateFixed size={13} />
          )}
          {locStatus === "locating" ? "Mencari..." : "Kemas Kini"}
        </button>
      </section>

      {/* LOCATING SKELETON */}
      {locStatus === "locating" && (
        <div
          className="rounded-2xl border p-8 flex flex-col items-center gap-4"
          style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
        >
          <Loader2 size={32} className="animate-spin" style={{ color: "var(--accent)" }} />
          <p className="text-sm opacity-60">Mendapatkan lokasi anda…</p>
        </div>
      )}

      {/* LOCATION ERROR */}
      {locStatus === "error" && locError && (
        <div
          className="rounded-2xl border p-5 flex flex-col items-center text-center gap-3"
          style={{ background: "var(--accent-subtle)", borderColor: "var(--accent-border)" }}
        >
          <AlertCircle size={32} style={{ color: "var(--accent)" }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--accent)" }}>Ralat Lokasi</p>
            <p className="text-xs mt-1" style={{ color: "var(--accent)", opacity: 0.8 }}>{locError}</p>
          </div>
          <button
            onClick={locate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold"
            style={{ background: "var(--accent-border)", color: "var(--accent)" }}
          >
            <RefreshCw size={12} /> Cuba Lagi
          </button>
        </div>
      )}

      {/* COMPASS — shown once location is known */}
      {locStatus === "success" && (
        <>
          {/* Compass dial */}
          <div
            className="rounded-2xl border p-6 flex flex-col items-center gap-5"
            style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
          >
            {/* Dial */}
            <div className="relative w-64 h-64 select-none">
              {/* Outer ring */}
              <svg
                viewBox="0 0 256 256"
                className="absolute inset-0 w-full h-full"
                style={{
                  transform: hasCompass ? `rotate(${-displayHeading}deg)` : "none",
                  transition: "transform 0.15s ease-out",
                }}
              >
                {/* Background circle */}
                <circle cx="128" cy="128" r="120" fill="var(--card-border)" opacity="0.4" />

                {/* Tick marks */}
                {Array.from({ length: 72 }).map((_, i) => {
                  const angle = (i * 5 * Math.PI) / 180;
                  const isMajor = i % 6 === 0;
                  const r1 = isMajor ? 108 : 112;
                  const r2 = 120;
                  const x1 = 128 + r1 * Math.sin(angle);
                  const y1 = 128 - r1 * Math.cos(angle);
                  const x2 = 128 + r2 * Math.sin(angle);
                  const y2 = 128 - r2 * Math.cos(angle);
                  return (
                    <line
                      key={i}
                      x1={x1} y1={y1} x2={x2} y2={y2}
                      stroke="var(--muted)"
                      strokeWidth={isMajor ? 2 : 1}
                      opacity={isMajor ? 0.6 : 0.3}
                    />
                  );
                })}

                {/* Cardinal labels */}
                {[
                  { label: "U", angle: 0 },
                  { label: "T", angle: 90 },
                  { label: "S", angle: 180 },
                  { label: "B", angle: 270 },
                ].map(({ label, angle }) => {
                  const rad = (angle * Math.PI) / 180;
                  const r = 94;
                  const x = 128 + r * Math.sin(rad);
                  const y = 128 - r * Math.cos(rad);
                  return (
                    <text
                      key={label}
                      x={x}
                      y={y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="13"
                      fontWeight="700"
                      fill={label === "U" ? "var(--accent)" : "var(--muted)"}
                      opacity={0.9}
                    >
                      {label}
                    </text>
                  );
                })}
              </svg>

              {/* Qibla needle — fixed, points toward qibla */}
              <svg
                viewBox="0 0 256 256"
                className="absolute inset-0 w-full h-full"
                style={{
                  transform: needleAngle != null ? `rotate(${needleAngle}deg)` : "none",
                  transition: "transform 0.2s ease-out",
                }}
              >
                {/* Glow when aligned */}
                {almostAligned && (
                  <circle
                    cx="128"
                    cy="128"
                    r="60"
                    fill="var(--accent)"
                    opacity={isAligned ? 0.12 : 0.06}
                  />
                )}

                {/* Kaabah icon needle (up = qibla direction) */}
                {/* Needle shaft */}
                <rect
                  x="126"
                  y="50"
                  width="4"
                  height="72"
                  rx="2"
                  fill="var(--accent)"
                  opacity="0.9"
                />
                {/* Arrowhead */}
                <polygon
                  points="128,36 121,56 135,56"
                  fill="var(--accent)"
                />
                {/* Tail */}
                <rect
                  x="126"
                  y="128"
                  width="4"
                  height="48"
                  rx="2"
                  fill="var(--muted)"
                  opacity="0.4"
                />

                {/* Center dot */}
                <circle cx="128" cy="128" r="6" fill="var(--card-bg)" stroke="var(--accent)" strokeWidth="2" />
              </svg>

              {/* Center label */}
              {!hasCompass && (
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center"
                  style={{ pointerEvents: "none" }}
                >
                  <Compass size={24} style={{ color: "var(--muted)", opacity: 0.5 }} />
                </div>
              )}
            </div>

            {/* Alignment status */}
            <div className="text-center space-y-1">
              {isAligned ? (
                <p className="text-sm font-bold" style={{ color: "var(--accent)" }}>
                  ✓ Tepat menghadap Kiblat
                </p>
              ) : almostAligned ? (
                <p className="text-sm font-semibold" style={{ color: "var(--accent)", opacity: 0.8 }}>
                  Hampir tepat — putar sedikit lagi
                </p>
              ) : (
                <p className="text-sm opacity-60">
                  Hadapkan anak panah ke arah solat anda
                </p>
              )}
            </div>
          </div>

          {/* Info cards */}
          <div className="grid grid-cols-2 gap-3">
            {/* Bearing */}
            <div
              className="rounded-2xl border p-4 flex flex-col gap-1"
              style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
            >
              <p className="text-xs font-semibold opacity-50 uppercase tracking-wide">Arah Kiblat</p>
              <p className="text-lg font-bold leading-tight" style={{ color: "var(--accent)" }}>
                {qiblaBearing != null ? `${qiblaBearing.toFixed(1)}°` : "—"}
              </p>
              <p className="text-[11px] opacity-50">dari Utara (CW)</p>
            </div>

            {/* Distance */}
            <div
              className="rounded-2xl border p-4 flex flex-col gap-1"
              style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
            >
              <p className="text-xs font-semibold opacity-50 uppercase tracking-wide">Jarak ke Kaabah</p>
              <p className="text-lg font-bold leading-tight" style={{ color: "var(--accent)" }}>
                {distanceLabel ?? "—"}
              </p>
              <p className="text-[11px] opacity-50">kilometer</p>
            </div>
          </div>

          {/* Compass unavailable notice */}
          {!hasCompass && compassPermission !== "denied" && (
            <div
              className="rounded-2xl border p-4 flex items-start gap-3"
              style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
            >
              <Compass size={18} style={{ color: "var(--accent)" }} className="shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">Kompas Peranti</p>
                <p className="text-xs opacity-60 mt-0.5">
                  Kompas automatik tidak tersedia. Gunakan nilai bearing di atas dan putar badan anda menghadap arah tersebut dari Utara.
                </p>
                {typeof (DeviceOrientationEvent as any)?.requestPermission === "function" && (
                  <button
                    onClick={startCompass}
                    className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                    style={{
                      background: "var(--accent-subtle)",
                      color: "var(--accent)",
                      border: "1px solid var(--accent-border)",
                    }}
                  >
                    <Compass size={11} /> Aktifkan Kompas
                  </button>
                )}
              </div>
            </div>
          )}

          {compassPermission === "denied" && (
            <div
              className="rounded-2xl border p-4 flex items-start gap-3"
              style={{ background: "var(--accent-subtle)", borderColor: "var(--accent-border)" }}
            >
              <AlertCircle size={18} style={{ color: "var(--accent)" }} className="shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--accent)" }}>Kebenaran Kompas Ditolak</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--accent)", opacity: 0.8 }}>
                  Sila benarkan akses sensor gerakan dalam tetapan pelayar anda untuk menggunakan kompas langsung.
                </p>
              </div>
            </div>
          )}

          {/* Static guide */}
          <div
            className="rounded-2xl border p-4 space-y-2"
            style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
          >
            <p className="text-xs font-bold uppercase tracking-wide opacity-50">Cara Penggunaan</p>
            <ol className="text-xs space-y-1.5 opacity-70 list-decimal list-inside">
              <li>Pegang telefon rata (mendatar) di hadapan anda</li>
              <li>Pusing badan hingga anak panah menunjuk ke atas</li>
              <li>Anda kini menghadap Kiblat</li>
            </ol>
          </div>
        </>
      )}

      {/* Idle state */}
      {locStatus === "idle" && (
        <div
          className="rounded-2xl border p-8 flex flex-col items-center gap-4 text-center"
          style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
        >
          <Compass size={40} style={{ color: "var(--accent)", opacity: 0.5 }} />
          <div>
            <p className="text-sm font-semibold">Mendapatkan lokasi…</p>
            <p className="text-xs opacity-50 mt-1">Sila benarkan akses GPS</p>
          </div>
        </div>
      )}
    </main>
  );
}