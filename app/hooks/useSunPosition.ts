"use client";

export function useSunPosition(fajr?: string, maghrib?: string) {
  if (!fajr || !maghrib) return 0;

  const now = new Date();

  const [fh, fm] = fajr.split(":").map(Number);
  const [mh, mm] = maghrib.split(":").map(Number);

  const start = new Date();
  start.setHours(fh, fm, 0);

  const end = new Date();
  end.setHours(mh, mm, 0);

  const total = end.getTime() - start.getTime();
  const progress = now.getTime() - start.getTime();

  const percent = (progress / total) * 100;

  return Math.max(0, Math.min(100, percent));
}