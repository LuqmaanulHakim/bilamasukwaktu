"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setFadeOut(true);
    }, 450); // start fade out

    const timer2 = setTimeout(() => {
      setVisible(false);
    }, 450); // remove from DOM

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`
        fixed inset-0 z-[9999] flex items-center justify-center
        bg-gradient-to-b from-[#050816] via-[#0b1220] to-black
        transition-opacity duration-700
        ${fadeOut ? "opacity-0" : "opacity-100"}
      `}
    >
      {/* Glow background */}
      <div className="absolute w-72 h-72 bg-blue-500/20 blur-3xl rounded-full animate-pulse" />

      {/* Content */}
      <div className="text-center relative">
        {/* Moon */}
        <div className="flex justify-center mb-4">
            <Image
                src="/icon_bmw.png"
                alt="Moon"
                width={100}
                height={100}
                priority
                className="object-contain"
            />
        </div>
      </div>
    </div>
  );
}