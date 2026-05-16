const API_waktusolat =
  process.env.NEXT_PUBLIC_WAKTU_SOLAT_API_URL;

export async function getPrayerTimes(zone: string) {
  const res = await fetch(
    `${API_waktusolat}/solat/${zone}`,
    {
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch prayer times");
  }

  return res.json();
}

export async function getZones() {
  const res = await fetch(
    `${API_waktusolat}/zones`,
    {
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch zones");
  }

  return res.json();
}