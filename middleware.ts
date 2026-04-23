import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
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
  const { data: { user } } = await sb.auth.getUser();

  const pathname = req.nextUrl.pathname;
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/auth");
  if (!user && !isAuthPage) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Invisible activity log — only for authed users, non-auth pages, and HTML navigations.
  const accept = req.headers.get("accept") || "";
  const looksLikeHtml = accept.includes("text/html") || accept === "" || accept === "*/*";
  const isAsset = /\.(ico|png|jpg|jpeg|svg|webp|avif|css|js|map|woff2?|ttf)$/i.test(pathname);
  if (user && !isAuthPage && looksLikeHtml && !isAsset) {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (serviceKey && supaUrl) {
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || null;
      const ua = req.headers.get("user-agent") || null;
      // fire-and-forget
      fetch(`${supaUrl}/rest/v1/activity_log`, {
        method: "POST",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ user_id: user.id, path: pathname, ip, ua }),
      }).catch(() => {});
    }
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/public).*)"],
};
