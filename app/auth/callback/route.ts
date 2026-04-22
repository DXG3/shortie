import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

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
  await sb.auth.exchangeCodeForSession(code);
  return res;
}
