import { currentProfile, supabaseServer, supabaseAdmin } from "@/lib/supabase/server";
import { Nav } from "@/components/Nav";
import { PointsChart } from "@/components/PointsChart";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

function fmtDay(d: Date) {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

async function buildChart(submitterId: string) {
  const sb = supabaseAdmin();
  const { data } = await sb.from("daily_points").select("*").eq("submitter_id", submitterId);
  const byDay = new Map<string, number>();
  (data || []).forEach((r: any) => byDay.set(r.day, r.net));
  const days: { day: string; net: number; running: number }[] = [];
  let running = 0;
  const { data: priorAgg } = await sb
    .from("submissions").select("awarded_points")
    .eq("submitter_id", submitterId).in("status", ["approved","amended"])
    .lt("created_at", new Date(Date.now() - 30 * 864e5).toISOString());
  const { data: priorSpend } = await sb
    .from("redemptions").select("cost_at_redemption")
    .eq("submitter_id", submitterId)
    .lt("created_at", new Date(Date.now() - 30 * 864e5).toISOString());
  running += (priorAgg || []).reduce((s: number, r: any) => s + (r.awarded_points || 0), 0);
  running -= (priorSpend || []).reduce((s: number, r: any) => s + (r.cost_at_redemption || 0), 0);

  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const net = byDay.get(key) || 0;
    running += net;
    days.push({ day: fmtDay(d), net, running });
  }
  return days;
}

export default async function Home() {
  const me = await currentProfile();
  if (!me) redirect("/login");

  const sb = supabaseServer();
  const admin = supabaseAdmin();

  if (me.role === "admin") {
    const { data: submitters } = await admin.from("profiles").select("*").eq("role", "submitter").order("created_at");
    const { data: pending } = await admin.from("submissions").select("*").eq("status", "pending");
    const { data: balances } = await admin.from("point_balances").select("*");
    const balMap = new Map((balances || []).map((b: any) => [b.submitter_id, b.balance]));

    return (
      <>
        <Nav role="admin" />
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card">
            <p className="label">Pending requests</p>
            <p className="display text-5xl text-white">{pending?.length ?? 0}</p>
            <Link href="/admin/queue" className="btn-primary mt-4">Open queue</Link>
          </div>
          <div className="card">
            <p className="label">Submitters</p>
            <ul className="space-y-2 mt-2">
              {(submitters || []).map((s: any) => (
                <li key={s.id} className="flex justify-between border-b border-white/5 py-2">
                  <span className="text-blush">{s.display_name || s.email}</span>
                  <span className="display text-2xl text-white">{balMap.get(s.id) ?? 0}</span>
                </li>
              ))}
              {(submitters || []).length === 0 && (
                <li className="text-blush/50 text-sm">No submitters yet. <Link href="/admin/invites" className="underline">Invite one.</Link></li>
              )}
            </ul>
          </div>
        </div>
      </>
    );
  }

  // submitter view
  const { data: balRow } = await admin.from("point_balances").select("balance").eq("submitter_id", me.id).single();
  const balance = balRow?.balance ?? 0;
  const { data: history } = await sb
    .from("submissions").select("*")
    .eq("submitter_id", me.id).order("created_at", { ascending: false }).limit(15);
  const chart = await buildChart(me.id);

  return (
    <>
      <Nav role="submitter" />
      <div className="card text-center mb-6">
        <p className="label">Your balance</p>
        <p className="display text-7xl text-white drop-shadow-[0_0_20px_rgba(214,90,122,0.6)]">{balance}</p>
        <p className="text-blush/60 text-sm mt-2">Good girl.</p>
        <div className="flex gap-3 justify-center mt-5">
          <Link href="/submit" className="btn-primary">Submit for points</Link>
          <Link href="/redeem" className="btn-ghost">Spend</Link>
        </div>
      </div>

      <div className="card mb-6">
        <PointsChart data={chart} />
      </div>

      <div className="card">
        <p className="label">Recent activity</p>
        {history && history.length ? (
          <ul className="divide-y divide-white/5">
            {history.map((h: any) => (
              <li key={h.id} className="py-3 flex items-start gap-3">
                <div className="flex-1">
                  <p className="text-blush">{h.reason}</p>
                  {h.admin_note && <p className="text-blush/50 text-sm italic mt-0.5">&ldquo;{h.admin_note}&rdquo;</p>}
                  <p className="text-blush/40 text-xs mt-1">{new Date(h.created_at).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <span className={`pill-${h.status}`}>
                    {h.status === "declined" ? "declined" :
                     h.status === "pending" ? "pending" :
                     `+${h.awarded_points}`}
                  </span>
                  {h.status !== "declined" && h.status !== "pending" && (
                    <p className="text-blush/40 text-xs mt-1">asked {h.requested_points}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-blush/50 text-sm">Nothing yet.</p>
        )}
      </div>
    </>
  );
}
