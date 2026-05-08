"use client";

import { useState } from "react";
import { useTheme } from "../context/ThemeContext";

type Zone = {
  jakimCode: string;
  negeri: string;
  daerah: string;
};

export default function ZoneSelector({
  zones,
  value,
  onChange,
}: {
  zones: Zone[];
  value: string;
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const selected = zones.find((z) => z.jakimCode === value);

  const filtered = zones.filter((z) =>
    `${z.jakimCode} ${z.negeri} ${z.daerah}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="relative w-full">
      {/* BUTTON */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-3 rounded-2xl flex items-center justify-between shadow-sm border transition-colors"
        style={{
          background: "var(--card-bg)",
          borderColor: "var(--card-border)",
          color: "var(--foreground)",
        }}
      >
        <div className="flex flex-col items-start">
          <span className="text-sm font-semibold">
            {selected?.jakimCode || "Select Zone"}
          </span>
          <span className="text-[11px] truncate max-w-[220px]" style={{ color: "var(--muted)" }}>
            {selected?.negeri}
          </span>
        </div>

        <span
          className={`transition-transform ${open ? "rotate-180" : ""}`}
          style={{ color: "var(--muted)" }}
        >
          ▼
        </span>
      </button>

      {/* DROPDOWN */}
      {open && (
        <div
          className="absolute left-0 top-full z-50 mt-2 w-full rounded-2xl shadow-lg border overflow-hidden"
          style={{
            background: "var(--card-bg)",
            borderColor: "var(--card-border)",
          }}
        >
          {/* SEARCH */}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search zone..."
            className="w-full px-4 py-3 text-sm outline-none border-b"
            style={{
              background: "var(--card-bg)",
              borderColor: "var(--card-border)",
              color: "var(--foreground)",
            }}
          />

          {/* LIST */}
          <div className="max-h-72 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="p-4 text-sm" style={{ color: "var(--muted)" }}>
                No zone found
              </p>
            )}

            {filtered.map((zone) => (
              <button
                key={zone.jakimCode}
                onClick={() => {
                  onChange(zone.jakimCode);
                  setOpen(false);
                  setSearch("");
                }}
                className="w-full text-left px-4 py-3 transition-colors"
                style={{
                  background: "transparent",
                  color: "var(--foreground)",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = isDark ? "#334155" : "#f9fafb")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                  {zone.jakimCode}
                </p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>
                  {zone.daerah}
                </p>
                <p className="text-[11px]" style={{ color: "var(--muted)" }}>
                  {zone.negeri}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}