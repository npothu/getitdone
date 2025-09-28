import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
export const runtime = "edge";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "getitdone",
  description: "Productivity for Women.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#FFF7F9] text-black`}
      >
        {/* Site Header */}
        <header className="glossy-header sticky top-0 z-30 w-full border-b border-[#EDEFF3]">
          <div className="max-w-[1400px] mx-3 px-3 sm:px-4 md:px-6 py-4 md:py-5 flex items-center justify-between">
            <div className="flex flex-col">
              <div className="metallic-text inline-block leading-tight text-3xl md:text-4xl lg:text-[44px] font-extrabold tracking-tight transition-transform duration-200 ease-out origin-left motion-safe:hover:scale-[1.04]">
                getitdone
              </div>
              <div className="md:mt-1 md:ml-10 text-base md:text-xl lg:text-2xl font-medium text-[#111827] leading-tight">
                your cycle, your strategy
              </div>
            </div>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}