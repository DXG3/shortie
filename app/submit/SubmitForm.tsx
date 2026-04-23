"use client";
import { useState } from "react";

type Kind = "claim" | "offer";

type Preset = {
  key: string;
  label: string;
  points: number;
  reason: string;
  hint?: string;
};

const PRESETS: Preset[] = [
  { key: "sir",        label: "Called you Sir",        points: 2,  reason: "I called you Sir today." },
  { key: "morning",    label: "Good morning",          points: 2,  reason: "I sent you a good morning message." },
  { key: "night",      label: "Good night",            points: 2,  reason: "I sent you a good night message." },
  { key: "update",     label: "Day update",            points: 2,  reason: "I sent you an update on how my day is going." },
  { key: "accurate",   label: "On-the-dot message",    points: 5,  reason: "I hit the agreed time exactly.", hint: "bonus for accuracy" },
  { key: "photo",      label: "Sexy photo",            points: 3,  reason: "I sent you a sexy photo. Rate me 1–5.", hint: "you set the 1–5 rating" },
  { key: "thinking",   label: "Thinking of you",       points: 2,  reason: "I told you what I was thinking about — you popped into my head." },
  { key: "song",       label: "Song suggestion",       points: 2,  reason: "I added a song to our playlist." },
  { key: "combo",      label: "Daily combo bonus",     points: 5,  reason: "I hit a combination of earners today.", hint: "only claim if you did several" },
];

export function SubmitForm({ action }: { action: (fd: FormData) => Promise<void> }) {
  const [kind, setKind] = useState<Kind>("claim");
  const [points, setPoints] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const label = kind === "claim"
    ? "Because I…"
    : "I'm willing to…";
  const placeholder = kind === "claim"
    ? "…held back for 3 days straight."
    : "…keep my hands off until you say so.";

  function applyPreset(p: Preset) {
    setKind("claim");
    setPoints(String(p.points));
    setReason(p.reason);
    setActivePreset(p.key);
  }

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

      {kind === "claim" && (
        <div>
          <p className="label">Quick earners</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {PRESETS.map((p) => {
              const on = activePreset === p.key;
              return (
                <button
                  type="button"
                  key={p.key}
                  onClick={() => applyPreset(p)}
                  className={`rounded-xl border px-3 py-2 text-left transition ${
                    on
                      ? "border-rose bg-rose/20 text-white shadow-glow"
                      : "border-white/10 text-blush/80 hover:border-rose-soft"
                  }`}>
                  <p className="text-sm">{p.label}</p>
                  <p className="text-xs opacity-70">+{p.points} pts{p.hint ? ` · ${p.hint}` : ""}</p>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-blush/50">
            Tap a preset to prefill. Adjust the points or wording before you send.
          </p>
        </div>
      )}

      <div>
        <label className="label">Points {kind === "claim" ? "deserved" : "wanted"}</label>
        <input
          name="points"
          type="number"
          min={1}
          required
          className="input"
          value={points}
          onChange={(e) => { setPoints(e.target.value); setActivePreset(null); }}
        />
      </div>
      <div>
        <label className="label">{label}</label>
        <textarea
          name="reason"
          required
          rows={5}
          className="input"
          placeholder={placeholder}
          value={reason}
          onChange={(e) => { setReason(e.target.value); setActivePreset(null); }}
        />
      </div>
      <button className="btn-primary w-full">
        {kind === "claim" ? "Send for approval" : "Send offer"}
      </button>
    </form>
  );
}
