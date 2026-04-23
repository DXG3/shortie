import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

async function notifyAdminLogin(userId: string, ip: string | null, ua: string | null) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  // Don't notify on admin's own logins — reduce noise. Optional.
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
  const { data: profile } = await admin.from("profiles")
    .select("role,email,nickname,display_name").eq("id", userId).single();
  if (!profile || profile.role === "admin") return;

  const who = profile.nickname || profile.display_name || profile.email;
  const lines = [
    `*Login*`,
    ``,
    `*${who}* just signed in.`,
  ];
  if (ip) lines.push(`_ip: ${ip}_`);
  if (ua) {
    const short = ua.length > 80 ? ua.slice(0, 80) + "…" : ua;
    lines.push(`_ua: ${short}_`);
  }

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: lines.join("\n"),
        parse_mode: "Markdown",
        disable_notification: false,
      }),
    });
  } catch {}
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const res = NextResponse.redirect(new URL("/", req.url));
  if (!code) return res;

  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (n: string) => req.cookies.get(n)?.value,
        set: (n: string, v: string, o: any) => res.cookies.set({ name: n, value: v, ...o }),
        remove: (n: string, o: any) => res.cookies.set({ name: n, value: "", ...o }),
      },
    },
  );
  const { data, error } = await sb.auth.exchangeCodeForSession(code);

  if (!error && data?.user?.id) {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      null;
    const ua = req.headers.get("user-agent");
    // Fire-and-forget; don't block the redirect.
    notifyAdminLogin(data.user.id, ip, ua).catch(() => {});
  }

  return res;
}
