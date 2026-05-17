"use client";

import { useState } from "react";

type GpsStatus = "idle" | "locating" | "success" | "error";

type GpsZoneResult = {
  zone: string;
  state: string;
  district: string;
};

const API_waktusolat = process.env.NEXT_PUBLIC_WAKTU_SOLAT_API_URL;

export function useGpsZone() {
  const [status, setStatus] = useState<GpsStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [detected, setDetected] = useState<GpsZoneResult | null>(null);

  async function locate(onZoneFound: (jakimCode: string) => void) {
    if (!navigator.geolocation) {
      setError("GPS tidak disokong oleh peranti anda.");
      setStatus("error");
      return;
    }

    setStatus("locating");
    setError(null);
    setDetected(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `${API_waktusolat}/zones/${latitude}/${longitude}`
          );
          if (!res.ok) throw new Error("Gagal mendapatkan zon.");
          const data: GpsZoneResult = await res.json();
          setDetected(data);
          setStatus("success");
          onZoneFound(data.zone);

          // Reset success badge after 4 seconds
          setTimeout(() => setStatus("idle"), 4000);
        } catch {
          setError("Gagal mendapatkan zon dari pelayan.");
          setStatus("error");
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setError("Kebenaran lokasi ditolak. Sila benarkan akses GPS.");
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setError("Lokasi tidak dapat dikesan.");
        } else {
          setError("Masa tamat. Cuba lagi.");
        }
        setStatus("error");
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  }

  return { status, error, detected, locate };
}