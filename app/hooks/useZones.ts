"use client";

import { useEffect, useState } from "react";
import { getZones } from "../lib/api";

export function useZones() {
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchZones() {
      try {
        const res = await getZones();
        setZones(res);
      } finally {
        setLoading(false);
      }
    }

    fetchZones();
  }, []);

  return { zones, loading };
}