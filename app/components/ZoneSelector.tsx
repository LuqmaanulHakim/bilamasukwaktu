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
    `${z.daerah} ${z.negeri} ${z.jakimCode}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="relative w-full">
      {/* BUTTON */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-3 rounded-xl bg-white/20 text-white border border-white/30 backdrop-blur-md flex justify-between"
      >
        <span className="text-sm font-medium">
            {selected?.jakimCode || "Select Zone"}
        </span>
        <span>▼</span>
      </button>

      {/* DROPDOWN */}
      {open && (
        <div className="absolute z-50 mt-2 w-full bg-white rounded-xl shadow-lg overflow-hidden">
          {/* SEARCH */}
          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search zone..."
            className="w-full px-3 py-2 border-b text-sm outline-none"
          />

          {/* LIST */}
          <div className="max-h-64 overflow-y-auto">
            {filtered.map((zone) => (
              <button
                key={zone.jakimCode}
                onClick={() => {
                  onChange(zone.jakimCode);
                  setOpen(false);
                  setSearch("");
                }}
                className="w-full text-left px-3 py-3 hover:bg-gray-100"
              >
                <p className="text-sm font-medium">
                  {zone.daerah}
                </p>
                <p className="text-xs text-gray-500">
                  {zone.negeri} ({zone.jakimCode})
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}