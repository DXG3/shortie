export type TelegramChat = { id: string; name: string; username: string | null };

export async function fetchRecentBotChats(): Promise<TelegramChat[]> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return [];
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates?limit=100`, { cache: "no-store" });
    const json: any = await res.json();
    if (!json?.ok) return [];
    const seen = new Map<string, TelegramChat>();
    for (const u of json.result || []) {
      const chat = u.message?.chat ?? u.edited_message?.chat ?? u.callback_query?.message?.chat;
      if (!chat || chat.type !== "private") continue;
      const id = String(chat.id);
      if (seen.has(id)) continue;
      seen.set(id, {
        id,
        name: [chat.first_name, chat.last_name].filter(Boolean).join(" ") || chat.username || id,
        username: chat.username ?? null,
      });
    }
    return [...seen.values()];
  } catch {
    return [];
  }
}
