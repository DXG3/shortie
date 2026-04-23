import { Nav } from "@/components/Nav";
import { currentProfile } from "@/lib/supabase/server";
import { setSubmitterProfile } from "@/app/actions";
import { NICKNAME_SUGGESTIONS, SAFE_WORD_SUGGESTIONS } from "@/lib/agreement";
import { SetupForm } from "./SetupForm";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const me = await currentProfile();
  if (!me) redirect("/login");
  if (me.role !== "submitter") redirect("/");

  return (
    <>
      <Nav role="submitter" />
      <div className="card">
        <h2 className="display text-3xl text-white mb-1">Your little details</h2>
        <p className="text-blush/60 text-sm mb-6">He wants to know what to call you, and how to stop the world.</p>
        <SetupForm
          action={setSubmitterProfile}
          defaults={{
            nickname: me.nickname || "",
            safeWord: me.safe_word || "",
            chatId: me.telegram_chat_id || "",
          }}
          nicknameSuggestions={NICKNAME_SUGGESTIONS}
          safeWordSuggestions={SAFE_WORD_SUGGESTIONS}
        />
      </div>
    </>
  );
}
