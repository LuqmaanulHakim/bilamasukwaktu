"use client";

import { useState } from "react";

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

  const selected = zones.find(
    (z) => z.jakimCode === value
  );

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
        className="
          w-full px-4 py-3 rounded-2xl
          border border-gray-200 bg-white
          text-gray-800 flex items-center justify-between
          shadow-sm
        "
      >
        <div className="flex flex-col items-start">
          <span className="text-sm font-semibold">
            {selected?.jakimCode || "Select Zone"}
          </span>

          <span className="text-[11px] text-gray-500 truncate max-w-[220px]">
            {selected?.negeri}
          </span>
        </div>

        <span
          className={`text-gray-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        >
          ▼
        </span>
      </button>

      {/* DROPDOWN */}
      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-full bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {/* SEARCH */}
          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search zone..."
            className="w-full px-4 py-3 border-b text-sm outline-none"
          />

          {/* LIST */}
          <div className="max-h-72 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="p-4 text-sm text-gray-500">
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
                className="w-full text-left px-4 py-3 hover:bg-gray-50"
              >
                <p className="text-sm font-semibold text-gray-900">
                  {zone.jakimCode}
                </p>

                <p className="text-xs text-gray-500 truncate">
                  {zone.daerah}
                </p>

                <p className="text-[11px] text-gray-400">
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