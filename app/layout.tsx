import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import DisableZoom from "./components/DisableZoom";
import BottomNav from "./components/BottomNav";
import { ThemeProvider } from "./context/ThemeContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Waktu Solat",
  description: "Prayer times for Malaysia",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover", // IMPORTANT for iPhone safe area
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col overflow-x-hidden">
        <ThemeProvider>
          <DisableZoom />

          {/* MAIN CONTENT */}
          <main className="flex-1 pb-[calc(80px+env(safe-area-inset-bottom))]">
            {children}
          </main>

          {/* BOTTOM NAV */}
          <div className="fixed bottom-0 left-0 right-0 z-50">
            <div className="pb-[env(safe-area-inset-bottom)]">
              <BottomNav />
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}