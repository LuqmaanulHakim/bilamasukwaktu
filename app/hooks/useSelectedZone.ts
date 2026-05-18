"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "selectedZone";
const DEFAULT_ZONE = "WLY01";

export function useSelectedZone() {
  const [zone, setZoneState] = useState<string>(DEFAULT_ZONE);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setZoneState(saved);
    setIsHydrated(true);
  }, []);

  function setZone(newZone: string) {
    localStorage.setItem(STORAGE_KEY, newZone);
    setZoneState(newZone);
  }

  return { zone, setZone, isHydrated };
}