"use client";

import { useWaktuSolatWeek } from "../hooks/useWaktuSolatWeek";
import { useSelectedZone }   from "../hooks/useSelectedZone";
import { usePrayerPopup }    from "../hooks/usePrayerPopup";
import { useTheme }          from "../context/ThemeContext";
import PrayerPopup           from "./PrayerPopup";

export default function PrayerPopupProvider() {
  const { zone }          = useSelectedZone();
  const { week }          = useWaktuSolatWeek(zone);
  const { showPopup }     = useTheme();
  const { popup, dismiss } = usePrayerPopup(showPopup ? (week[0] ?? null) : null);

  return <PrayerPopup popup={popup} onDismiss={dismiss} />;
}