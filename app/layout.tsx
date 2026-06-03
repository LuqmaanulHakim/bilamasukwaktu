import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import DisableZoom from "./components/DisableZoom";
import BottomNav from "./components/BottomNav";
import { ThemeProvider } from "./context/ThemeContext";
import SplashScreen from "./components/SplashScreen";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Waktu Solat",
  description: "Prayer times for Malaysia",

  manifest: "/manifest.json",

  icons: {
    icon: "/icon_bmw.png",
    apple: "/icon_bmw.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
    { media: "(prefers-color-scheme: light)", color: "#dbeafe" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <DisableZoom />
          <SplashScreen />
          {children}
          <BottomNav />
        </ThemeProvider>
      </body>
    </html>
  );
}