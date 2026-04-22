import "./globals.css";
import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
});
const body = Inter({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "Good Girl Points",
  description: "Shortie's Edging Progress",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-screen">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <header className="mb-10 text-center">
            <p className="text-xs uppercase tracking-[0.4em] text-blush/50">Good Girl Points</p>
            <h1 className="display text-5xl md:text-6xl text-white mt-2">Edging Katie</h1>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
