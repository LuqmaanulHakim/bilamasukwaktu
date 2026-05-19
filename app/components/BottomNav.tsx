"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "../context/ThemeContext";
import { IconSettings, IconSettingsFilled, IconHome, IconHomeFilled, IconCurrentLocation, IconCurrentLocationFilled } from "@tabler/icons-react";

const tabs = [
  {
    href: "/",
    label: "Utama",
    icon: (active: boolean) =>
      active ? (
        <IconHomeFilled size={24} stroke={1.8} />
      ) : (
        <IconHome size={24} stroke={1.8} />
      ),
  },
  {
    href: "/tempat-solat",
    label: "Dekat Saya",
    icon: (active: boolean) =>
      active ? (
        <IconCurrentLocationFilled size={24} stroke={1.8} />
      ) : (
        <IconCurrentLocation size={24} stroke={1.8} />
      ),
  },
  {
    href: "/settings",
    label: "Tetapan",
    icon: (active: boolean) =>
      active ? (
        <IconSettingsFilled size={24} stroke={1.8} />
      ) : (
        <IconSettings size={24} stroke={1.8} />
      ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-md border-t shadow-[0_-4px_24px_rgba(0,0,0,0.06)] transition-colors duration-200"
      style={{
        background: isDark ? "rgba(15,23,42,0.90)" : "rgba(255,255,255,0.90)",
        borderColor: "var(--card-border)",
      }}
    >
      <div className="max-w-md mx-auto flex">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex-1 relative flex flex-col items-center justify-center gap-1 py-3 transition-colors duration-200"
              style={{ color: active ? "var(--accent)" : "var(--muted)" }}
            >
              {tab.icon(active)}
              <span
                className="text-[11px] font-semibold tracking-wide transition-colors duration-200"
                style={{ color: active ? "var(--accent)" : "var(--muted)" }}
              >
                {tab.label}
              </span>

              {/* Active indicator bar */}
              {active && (
                <span
                  className="absolute bottom-0 w-10 h-0.5 rounded-full"
                  style={{ background: "var(--accent)" }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}