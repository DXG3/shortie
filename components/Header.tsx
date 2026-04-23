"use client";
import { usePathname } from "next/navigation";

export function Header({ title }: { title: string }) {
  const pathname = usePathname();
  const onAuthPage = pathname?.startsWith("/login") || pathname?.startsWith("/auth");

  if (onAuthPage) {
    return (
      <header className="mb-6 sm:mb-10 text-center">
        <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] sm:tracking-[0.4em] text-blush/50">Private portal</p>
        <h1 className="display text-4xl sm:text-5xl md:text-6xl text-white mt-2">Velvet</h1>
      </header>
    );
  }

  return (
    <header className="mb-6 sm:mb-10 text-center">
      <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] sm:tracking-[0.4em] text-blush/50">Good Girl Points</p>
      <h1 className="display text-4xl sm:text-5xl md:text-6xl text-white mt-2">{title}</h1>
    </header>
  );
}
