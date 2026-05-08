"use client";

import ZoneSelector from "./ZoneSelector";

export default function SettingsModal({
  open,
  onClose,
  zones,
  zone,
  setZone,
}: {
  open: boolean;
  onClose: () => void;
  zones: any[];
  zone: string;
  setZone: (val: string) => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50">
      <div className="bg-white w-full max-w-md rounded-t-3xl p-5 space-y-4 animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">
            Settings
          </h2>

          <button
            onClick={onClose}
            className="text-gray-500"
          >
            ✕
          </button>
        </div>

        {/* Zone Selector */}
        <ZoneSelector
          zones={zones}
          value={zone}
          onChange={setZone}
        />
      </div>
    </div>
  );
}