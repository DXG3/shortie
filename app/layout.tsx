import "./globals.css";
import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { Header } from "@/components/Header";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
});
const body = Inter({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "Velvet",
  description: "Private portal",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0a0608",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-screen">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-10">
          <Header />
          {children}
        </div>
      </body>
    </html>
  );
}
