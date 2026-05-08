"use client";

import ZoneSelector from "../components/ZoneSelector";
import { useZones } from "../hooks/useZones";
import { useSelectedZone } from "../hooks/useSelectedZone";

export default function SettingsPage() {
  const { zones, loading: zonesLoading } = useZones();
  const { zone, setZone } = useSelectedZone();

  return (
    <main className="w-full max-w-md mx-auto min-h-screen px-4 py-4 pb-24 space-y-5">
      {/* HEADER */}
      <section className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-3xl p-6 shadow-xl">
        <p className="text-sm opacity-80">Preferences</p>
        <h1 className="text-2xl font-bold mt-1">Settings</h1>
        <p className="mt-1 text-sm opacity-80">
          Customise your prayer time zone
        </p>
      </section>

      {/* ZONE SELECTOR */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              className="w-4 h-4 text-indigo-600"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">Prayer Zone</p>
            <p className="text-xs text-gray-400">Select your JAKIM zone</p>
          </div>
        </div>

        {zonesLoading ? (
          <p className="text-sm text-gray-400">Loading zones...</p>
        ) : (
          <ZoneSelector zones={zones} value={zone} onChange={setZone} />
        )}
      </section>
    </main>
  );
}