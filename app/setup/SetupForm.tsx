"use client";
import { useRef, useState } from "react";

export function SetupForm({
  action,
  defaults,
  nicknameSuggestions,
  safeWordSuggestions,
}: {
  action: (fd: FormData) => Promise<void>;
  defaults: { nickname: string; safeWord: string; chatId: string };
  nicknameSuggestions: string[];
  safeWordSuggestions: string[];
}) {
  const nickRef = useRef<HTMLInputElement | null>(null);
  const swRef = useRef<HTMLInputElement | null>(null);
  const [showTelegram, setShowTelegram] = useState(false);

  function setField(ref: React.MutableRefObject<HTMLInputElement | null>, v: string) {
    if (ref.current) {
      ref.current.value = v;
      ref.current.focus();
    }
  }

  return (
    <form action={action} className="space-y-6">
      <section>
        <label className="label">His name for you</label>
        <input ref={nickRef} name="nickname" defaultValue={defaults.nickname} className="input" placeholder="kitten, doll, poppet…" />
        <div className="flex flex-wrap gap-2 mt-2">
          {nicknameSuggestions.map((s) => (
            <button type="button" key={s} onClick={() => setField(nickRef, s)}
              className="pill-pending cursor-pointer hover:text-white">{s}</button>
          ))}
        </div>
      </section>

      <section>
        <label className="label">Your safe word</label>
        <input ref={swRef} name="safe_word" defaultValue={defaults.safeWord} className="input" placeholder="one word you'll remember" />
        <div className="flex flex-wrap gap-2 mt-2">
          {safeWordSuggestions.map((s) => (
            <button type="button" key={s} onClick={() => setField(swRef, s)}
              className="pill-pending cursor-pointer hover:text-white">{s}</button>
          ))}
        </div>
        <p className="text-blush/50 text-xs mt-2">Say or type this anywhere, any time, and everything stops.</p>
      </section>

      <section>
        <label className="label flex items-center justify-between">
          <span>Your Telegram ID</span>
          <button type="button" onClick={() => setShowTelegram(!showTelegram)}
            className="text-rose-soft text-xs normal-case tracking-normal underline">
            {showTelegram ? "hide" : "how do I get this?"}
          </button>
        </label>
        <input name="telegram_chat_id" defaultValue={defaults.chatId} className="input" placeholder="e.g. 123456789" />
        {showTelegram && (
          <ol className="mt-3 space-y-2 text-blush/80 text-sm list-decimal list-inside">
            <li>Install <strong>Telegram</strong> from your app store (iOS, Android, or desktop). Create an account if you don&apos;t have one.</li>
            <li>Open Telegram, tap search, and find <code className="px-1 bg-white/5 rounded">@Shortie_pts_bot</code> — open the chat and tap <strong>Start</strong>.</li>
            <li>In a new search, find <code className="px-1 bg-white/5 rounded">@userinfobot</code>. Open it and tap <strong>Start</strong>. It will reply with your details — copy the number next to <strong>Id</strong>.</li>
            <li>Paste that number into the field above and save.</li>
          </ol>
        )}
      </section>

      <button className="btn-primary w-full">Save</button>
    </form>
  );
}
