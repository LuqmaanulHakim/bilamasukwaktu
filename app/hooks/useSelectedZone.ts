"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "selectedZone";
const DEFAULT_ZONE = "JHR01";

export function useSelectedZone() {
  const [zone, setZoneState] = useState<string>(DEFAULT_ZONE);

  // Read from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setZoneState(saved);
  }, []);

  // Write to localStorage when zone changes
  function setZone(newZone: string) {
    localStorage.setItem(STORAGE_KEY, newZone);
    setZoneState(newZone);
  }

  return { zone, setZone };
}