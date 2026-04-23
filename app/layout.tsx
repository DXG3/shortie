import "./globals.css";
import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { Header } from "@/components/Header";
import { supabaseAdmin } from "@/lib/supabase/server";

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

async function loadTitle(): Promise<string> {
  try {
    const sb = supabaseAdmin();
    const { data } = await sb.from("app_settings").select("value").eq("key", "title").single();
    return data?.value || "Miss Sheridan";
  } catch {
    return "Miss Sheridan";
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const title = await loadTitle();
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-screen">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-10">
          <Header title={title} />
          {children}
        </div>
      </body>
    </html>
  );
}
