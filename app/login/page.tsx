"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"email" | "code">("email");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    const sb = supabaseBrowser();
    const { error } = await sb.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        shouldCreateUser: true,
      },
    });
    setBusy(false);
    if (error) { setError(error.message); return; }
    setStage("code");
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    const sb = supabaseBrowser();
    const { error } = await sb.auth.verifyOtp({
      email,
      token: code.trim(),
      type: "email",
    });
    setBusy(false);
    if (error) { setError(error.message); return; }
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="card">
        <h2 className="display text-3xl text-white mb-2">Come in</h2>
        <p className="text-blush/60 text-sm mb-6">By invitation only.</p>

        {stage === "email" && (
          <form onSubmit={sendCode} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" required
                value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            {error && <p className="text-sm text-rose-soft">{error}</p>}
            <button className="btn-primary w-full" disabled={busy}>
              {busy ? "Sending..." : "Send code"}
            </button>
          </form>
        )}

        {stage === "code" && (
          <form onSubmit={verify} className="space-y-4">
            <p className="text-blush/80 text-sm">
              Check your inbox at <span className="text-white">{email}</span>.<br />
              Enter the code from the email below — ignore the link, it can be flaky on phones.
            </p>
            <div>
              <label className="label">Code from email</label>
              <input
                className="input text-center text-2xl tracking-[0.4em] font-mono"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6,10}"
                maxLength={10}
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              />
            </div>
            {error && <p className="text-sm text-rose-soft">{error}</p>}
            <button className="btn-primary w-full" disabled={busy || code.length < 6}>
              {busy ? "Verifying..." : "Let me in"}
            </button>
            <button type="button" onClick={() => { setStage("email"); setCode(""); setError(null); }}
              className="text-blush/60 text-xs underline w-full">
              Use a different email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
