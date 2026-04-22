"use client";
import { useState } from "react";

type Kind = "claim" | "offer";

export function SubmitForm({ action }: { action: (fd: FormData) => Promise<void> }) {
  const [kind, setKind] = useState<Kind>("claim");

  const label = kind === "claim"
    ? "Because I…"
    : "I'm willing to…";
  const placeholder = kind === "claim"
    ? "…held back for 3 days straight."
    : "…keep my hands off until you say so.";

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="kind" value={kind} />

      <div className="grid grid-cols-2 gap-2">
        <button type="button"
          onClick={() => setKind("claim")}
          className={`rounded-xl border px-4 py-3 text-left transition ${
            kind === "claim"
              ? "border-rose bg-rose/20 text-white shadow-glow"
              : "border-white/10 text-blush/70 hover:border-rose-soft"
          }`}>
          <p className="text-xs uppercase tracking-[0.2em] opacity-70">I feel I deserve</p>
          <p className="text-sm mt-1">claim points for something I&apos;ve done</p>
        </button>
        <button type="button"
          onClick={() => setKind("offer")}
          className={`rounded-xl border px-4 py-3 text-left transition ${
            kind === "offer"
              ? "border-rose bg-rose/20 text-white shadow-glow"
              : "border-white/10 text-blush/70 hover:border-rose-soft"
          }`}>
          <p className="text-xs uppercase tracking-[0.2em] opacity-70">I&apos;m willing to do</p>
          <p className="text-sm mt-1">offer to earn points</p>
        </button>
      </div>

      <div>
        <label className="label">Points {kind === "claim" ? "deserved" : "wanted"}</label>
        <input name="points" type="number" min={1} required className="input" />
      </div>
      <div>
        <label className="label">{label}</label>
        <textarea name="reason" required rows={5} className="input" placeholder={placeholder} />
      </div>
      <button className="btn-primary w-full">
        {kind === "claim" ? "Send for approval" : "Send offer"}
      </button>
    </form>
  );
}
