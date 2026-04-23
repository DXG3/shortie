import { Nav } from "@/components/Nav";
import { currentProfile, supabaseAdmin } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

function since(ts: string) {
  const ms = Date.now() - new Date(ts).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default async function ActivityPage() {
  const me = await currentProfile();
  if (!me || me.role !== "admin") redirect("/");

  const sb = supabaseAdmin();
  const { data: events } = await sb
    .from("activity_log")
    .select("id, user_id, path, ip, ua, created_at, profiles!activity_log_user_id_fkey(email, nickname, display_name, role)")
    .order("created_at", { ascending: false })
    .limit(300);

  const userCounts = new Map<string, { name: string; role: string; count: number; last: string }>();
  for (const e of (events || []) as any[]) {
    if (!e.user_id) continue;
    const name = e.profiles?.nickname || e.profiles?.display_name || e.profiles?.email || "unknown";
    const cur = userCounts.get(e.user_id);
    if (cur) cur.count++;
    else userCounts.set(e.user_id, { name, role: e.profiles?.role || "?", count: 1, last: e.created_at });
  }

  return (
    <>
      <Nav role="admin" />
      <h2 className="display text-3xl text-white mb-6">Activity</h2>

      <div className="card mb-6">
        <p className="label mb-3">Last 300 events, per user</p>
        <ul className="space-y-2">
          {[...userCounts.entries()].map(([uid, u]) => (
            <li key={uid} className="flex items-center justify-between border-b border-white/5 pb-2">
              <div>
                <p className="text-blush">{u.name}</p>
                <p className="text-blush/50 text-xs">{u.role} · {u.count} events · last {since(u.last)}</p>
              </div>
            </li>
          ))}
          {userCounts.size === 0 && <li className="text-blush/50 text-sm">Nothing tracked yet.</li>}
        </ul>
      </div>

      <div className="card">
        <p className="label mb-3">Timeline</p>
        <ul className="divide-y divide-white/5">
          {(events || []).map((e: any) => {
            const name = e.profiles?.nickname || e.profiles?.display_name || e.profiles?.email || "—";
            return (
              <li key={e.id} className="py-2 flex items-baseline gap-3">
                <span className="text-blush/40 text-xs w-16 shrink-0">{since(e.created_at)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-blush text-sm truncate">
                    <span className="text-white">{name}</span>
                    <span className="text-blush/50"> · {e.path}</span>
                  </p>
                  {(e.ip || e.ua) && (
                    <p className="text-blush/40 text-[10px] truncate">{e.ip}{e.ua ? ` · ${e.ua.slice(0, 60)}` : ""}</p>
                  )}
                </div>
              </li>
            );
          })}
          {(events || []).length === 0 && <li className="text-blush/50 text-sm">Nothing yet.</li>}
        </ul>
      </div>
    </>
  );
}
