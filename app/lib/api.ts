export async function getPrayerTimes(zone: string) {
  const res = await fetch(
    `https://api.waktusolat.app/solat/${zone}`,
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
    `https://api.waktusolat.app/zones`,
    {
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch zones");
  }

  return res.json();
}
