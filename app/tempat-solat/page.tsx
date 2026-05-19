"use client";

import { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { useNearbyMosques, type MosquePlace } from "../hooks/useNearbyMosque";
import {
  LocateFixed,
  Loader2,
  AlertCircle,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import { IconMosque, IconLocation } from "@tabler/icons-react";

type FilterType = "semua" | "masjid" | "surau";

const FILTER_LABELS: Record<FilterType, string> = {
  semua: "Semua",
  masjid: "Masjid",
  surau: "Surau",
};

const MAPS_URL = process.env.NEXT_PUBLIC_MAPS_DIRECTIONS_URL;

function DistanceBadge({ km }: { km: number }) {
  const label = km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
  return (
    <span
      className="text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0"
      style={{ background: "var(--card-border)", color: "var(--muted)" }}
    >
      {label}
    </span>
  );
}

function TypeBadge({ type }: { type: MosquePlace["type"] }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const styles: Record<MosquePlace["type"], { label: string }> = {
    masjid: { label: "Masjid" },
    surau: { label: "Surau" },
    lain: { label: "Lain" },
  };

  return (
    <span
      className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0"
      style={{
        background: "var(--accent-subtle)",
        color: "var(--accent)",
        border: "1px solid var(--accent-border)",
      }}
    >
      {styles[type].label}
    </span>
  );
}

function MosqueCard({ place, isDark }: { place: MosquePlace; isDark: boolean }) {
  const directionsUrl = `${MAPS_URL}?api=1&destination=${place.lat},${place.lon}`;

  return (
    <div
      className="rounded-2xl border p-4 flex items-start gap-3 transition-all"
      style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
    >
      {/* Icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: "var(--accent-subtle)" }}
      >
        <IconMosque size={18} style={{ color: "var(--accent)" }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p
            className="text-sm font-semibold leading-snug line-clamp-2"
            style={{ color: "var(--foreground)" }}
          >
            {place.name}
          </p>
          <DistanceBadge km={place.distance} />
        </div>

        <div className="flex items-center gap-1.5 mb-2">
          <TypeBadge type={place.type} />
        </div>

        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors"
          style={{
            background: "var(--accent-subtle)",
            color: "var(--accent)",
            border: "1px solid var(--accent-border)",
          }}
        >
          <IconLocation size={12} />
          Dapatkan Arah
          <ChevronRight size={11} />
        </a>
      </div>
    </div>
  );
}

export default function TempatSolatPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { places, status, error, locate } = useNearbyMosques();
  const [filter, setFilter] = useState<FilterType>("semua");

  useEffect(() => {
    locate();
  }, [locate]);

  const filtered = places.filter(
    (p) => filter === "semua" || p.type === filter
  );

  const isLocating = status === "locating";
  const isLoading = status === "loading";
  const isBusy = isLocating || isLoading;
  const isSuccess = status === "success";
  const isError = status === "error";

  return (
    <main className="w-full max-w-md mx-auto min-h-screen px-4 py-4 pb-24 space-y-4">
      {/* HEADER */}
      <section className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold mt-1">Tempat Solat</h1>
          <p className="mt-1 text-sm opacity-80">Masjid & surau berdekatan anda</p>
        </div>

        <button
          onClick={locate}
          disabled={isBusy}
          aria-label="Refresh lokasi"
          className="mt-1 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
          style={{
            background: "var(--accent-subtle)",
            color: "var(--accent)",
            border: "1px solid var(--accent-border)",
          }}
        >
          {isBusy ? (
            <Loader2 size={13} className="animate-spin" />
          ) : isSuccess ? (
            <RefreshCw size={13} />
          ) : (
            <LocateFixed size={13} />
          )}
          {isLocating ? "Mencari..." : isLoading ? "Memuatkan..." : "Kemas Kini"}
        </button>
      </section>

      {/* FILTER TABS */}
      {(isSuccess || isBusy) && (
        <div
          className="flex gap-2 p-1 rounded-2xl"
          style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}
        >
          {(["semua", "masjid", "surau"] as FilterType[]).map((f) => {
            const count =
              f === "semua"
                ? places.length
                : places.filter((p) => p.type === f).length;
            const active = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all"
                style={{
                  background: active ? "var(--accent-subtle)" : "transparent",
                  color: active ? "var(--accent)" : "var(--muted)",
                  border: active ? "1px solid var(--accent-border)" : "1px solid transparent",
                }}
              >
                {FILTER_LABELS[f]}
                {isSuccess && (
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                    style={{
                      background: active ? "var(--accent-border)" : "var(--card-border)",
                      color: active ? "var(--accent)" : "var(--muted)",
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* LOADING STATE */}
      {isBusy && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border p-4 flex gap-3"
              style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
            >
              <div
                className="w-10 h-10 rounded-xl animate-pulse shrink-0"
                style={{ background: "var(--card-border)" }}
              />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-4 w-3/4 rounded animate-pulse" style={{ background: "var(--card-border)" }} />
                <div className="h-3 w-1/2 rounded animate-pulse" style={{ background: "var(--card-border)" }} />
                <div className="h-3 w-2/3 rounded animate-pulse" style={{ background: "var(--card-border)" }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ERROR STATE */}
      {isError && error && (
        <div
          className="rounded-2xl border p-5 flex flex-col items-center text-center gap-3"
          style={{
            background: "var(--accent-subtle)",
            borderColor: "var(--accent-border)",
          }}
        >
          <AlertCircle size={32} style={{ color: "var(--accent)" }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
              Ralat
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--accent)", opacity: 0.8 }}>
              {error}
            </p>
          </div>
          <button
            onClick={locate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold"
            style={{
              background: "var(--accent-border)",
              color: "var(--accent)",
            }}
          >
            <RefreshCw size={12} />
            Cuba Lagi
          </button>
        </div>
      )}

      {/* RESULTS */}
      {isSuccess && !isBusy && (
        <>
          {filtered.length === 0 ? (
            <div
              className="rounded-2xl border p-6 text-center"
              style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
            >
              <IconMosque size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium opacity-60">
                Tiada {filter !== "semua" ? FILTER_LABELS[filter] : "tempat solat"} dijumpai
              </p>
              <p className="text-xs opacity-40 mt-1">Cuba tukar penapis atau kemas kini lokasi</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs px-1" style={{ color: "var(--muted)" }}>
                {filtered.length} tempat solat dalam radius 5 km
              </p>
              {filtered.map((place) => (
                <MosqueCard key={place.id} place={place} isDark={isDark} />
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}