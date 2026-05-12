"use client";

import { useState, useCallback } from "react";

export type MosquePlace = {
  id: number;
  name: string;
  lat: number;
  lon: number;
  distance: number; // in km
  type: "masjid" | "surau" | "lain";
  address: string;
};

type Status = "idle" | "locating" | "loading" | "success" | "error";

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function classifyType(name: string): MosquePlace["type"] {
  const lower = name.toLowerCase();
  if (lower.includes("surau")) return "surau";
  if (lower.includes("masjid") || lower.includes("mosque")) return "masjid";
  return "lain";
}

function resolveName(tags: Record<string, string>, type: MosquePlace["type"]): string {
  const name =
    tags["name"] ||
    tags["name:ms"] ||
    tags["name:en"] ||
    tags["alt_name"] ||
    tags["official_name"];

  if (name) return name;

  const street = tags["addr:street"] || tags["addr:suburb"] || tags["addr:village"] || "";
  const typeLabel = type === "surau" ? "Surau" : type === "masjid" ? "Masjid" : "Tempat Solat";

  return street ? `${typeLabel} di ${street}` : `${typeLabel} Berdekatan`;
}

function buildAddress(tags: Record<string, string>): string {
  return [
    tags["addr:housenumber"],
    tags["addr:street"],
    tags["addr:suburb"] || tags["addr:village"],
    tags["addr:city"] || tags["addr:town"],
    tags["addr:postcode"],
  ]
    .filter(Boolean)
    .join(", ");
}

export function useNearbyMosques() {
  const [places, setPlaces] = useState<MosquePlace[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);

  const fetch_ = useCallback(async (lat: number, lon: number) => {
    setStatus("loading");
    setError(null);

    const radius = 5000; // 5 km
    const query = `
      [out:json][timeout:25];
      (
        node["amenity"="place_of_worship"]["religion"="muslim"](around:${radius},${lat},${lon});
        way["amenity"="place_of_worship"]["religion"="muslim"](around:${radius},${lat},${lon});
        relation["amenity"="place_of_worship"]["religion"="muslim"](around:${radius},${lat},${lon});
      );
      out center tags;
    `;

    try {
      const res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: query,
      });
      if (!res.ok) throw new Error("Overpass API gagal.");
      const data = await res.json();

      const results: MosquePlace[] = data.elements
        .map((el: any) => {
          const elLat = el.lat ?? el.center?.lat;
          const elLon = el.lon ?? el.center?.lon;
          if (!elLat || !elLon) return null;

          const tags: Record<string, string> = el.tags || {};
          const name = resolveName(tags, classifyType(tags["name"] || ""));

          return {
            id: el.id,
            name,
            lat: elLat,
            lon: elLon,
            distance: haversine(lat, lon, elLat, elLon),
            type: classifyType(name),
            address: buildAddress(tags),
          } satisfies MosquePlace;
        })
        .filter(Boolean)
        .sort((a: MosquePlace, b: MosquePlace) => a.distance - b.distance);

      setPlaces(results);
      setStatus("success");
    } catch {
      setError("Gagal memuatkan data. Cuba lagi.");
      setStatus("error");
    }
  }, []);

  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      setError("GPS tidak disokong oleh peranti anda.");
      setStatus("error");
      return;
    }
    setStatus("locating");
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserCoords({ lat: latitude, lon: longitude });
        fetch_(latitude, longitude);
      },
      (err) => {
        const msgs: Record<number, string> = {
          1: "Kebenaran lokasi ditolak. Sila benarkan akses GPS.",
          2: "Lokasi tidak dapat dikesan.",
          3: "Masa tamat. Cuba lagi.",
        };
        setError(msgs[err.code] ?? "Ralat tidak diketahui.");
        setStatus("error");
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  }, [fetch_]);

  return { places, status, error, userCoords, locate };
}