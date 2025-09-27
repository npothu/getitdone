import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#FFF7F9] text-black`}>
        {/* Site Header */}
        <header className="glossy-header sticky top-0 z-50 w-full border-b border-[#EDEFF3]">
  <div className="max-w-6xl mx-2 px-9 py-7 flex items-center justify-between">
    <div
      className="metallic-text inline-block leading-none
                 text-3xl md:text-4xl lg:text-[44px] font-extrabold tracking-tight
                 transition-transform duration-200 ease-out origin-left
                 motion-safe:hover:scale-[1.04]"
    >
      getitdone
    </div>
    <div />
  </div>
</header>

        {children}
      </body>
    </html>
  );
}