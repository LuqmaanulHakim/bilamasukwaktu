import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: isDev,
});

const nextConfig: NextConfig = {
  allowedDevOrigins: ["10.212.241.47"],
};

export default withPWA(nextConfig);