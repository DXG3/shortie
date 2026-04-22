import { currentProfile, supabaseServer, supabaseAdmin } from "@/lib/supabase/server";
import { buildSessionChart, getSessionBalance, toLocalInput } from "@/lib/points";
import { fetchRecentBotChats } from "@/lib/telegram";
import { Nav } from "@/components/Nav";
import { PointsChart } from "@/components/PointsChart";
import { setSession, addMilestone, deleteMilestone, setSubmitterTelegram } from "@/app/actions";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

function timeLeft(endIso: string | null): string {
  if (!endIso) return "";
  const ms = new Date(endIso).getTime() - Date.now();
  if (ms <= 0) return "ended";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h left`;
  return `${h}h ${m}m left`;
}

function sampleChart() {
  const nets = [0, 1, 0, 2, 0, 0, 1, 2, 0, 1, 0, 0, 2, 0, 1, 0, 2, 0, 1, 0, 2, 0, 1, 0];
  let running = 0;
  return nets.map((n, i) => {
    running += n;
    return { label: `${i}h`, net: n, running };
  });
}

export default async function Home() {
  const me = await currentProfile();
  if (!me) redirect("/login");

  const sb = supabaseServer();
  const admin = supabaseAdmin();

  if (me.role === "admin") {
    const { data: submitters } = await admin.from("profiles").select("*").eq("role", "submitter").order("created_at");
    const { data: pending } = await admin.from("submissions").select("*").eq("status", "pending");
    const { data: allMilestones } = await admin.from("milestones").select("*").order("points");

    const milestonesBy = new Map<string, any[]>();
    for (const m of allMilestones || []) {
      if (!milestonesBy.has(m.submitter_id)) milestonesBy.set(m.submitter_id, []);
      milestonesBy.get(m.submitter_id)!.push(m);
    }

    const perSubmitter = await Promise.all(
      (submitters || []).map(async (s: any) => ({
        submitter: s,
        milestones: milestonesBy.get(s.id) || [],
        balance: await getSessionBalance(s.id, s.session_start, s.session_end),
        chart: await buildSessionChart(s.id, s.session_start, s.session_end),
      })),
    );

    const linkedChatIds = new Set((submitters || []).map((s: any) => s.telegram_chat_id).filter(Boolean));
    const recentChats = (await fetchRecentBotChats()).filter((c) => !linkedChatIds.has(c.id));

    return (
      <>
        <Nav role="admin" />
        <div className="card mb-6">
          <div className="flex items-center justify-between">
            <p className="label">Pending requests</p>
            <p className="display text-4xl text-white">{pending?.length ?? 0}</p>
          </div>
          <Link href="/admin/queue" className="btn-primary mt-4">Open queue</Link>
        </div>

        {perSubmitter.length === 0 && (
          <div className="card mb-6">
            <div className="flex items-baseline justify-between mb-3">
              <h3 className="display text-2xl text-white/80">Example chart</h3>
              <span className="text-blush/60 text-sm">preview only</span>
            </div>
            <p className="text-blush/50 text-xs mb-4">Invite a submitter to see her real data here. <Link href="/admin/invites" className="underline">Invite</Link>.</p>
            <div className="opacity-80">
              <PointsChart data={sampleChart()} milestones={[{ name: "tease", points: 10 }, { name: "edge", points: 25 }, { name: "reward", points: 50 }]} />
            </div>
          </div>
        )}

        {perSubmitter.map(({ submitter, milestones, balance, chart }) => {
          const hasSession = !!submitter.session_start && !!submitter.session_end;
          return (
            <div key={submitter.id} className="card mb-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
                <h3 className="display text-2xl text-white">{submitter.display_name || submitter.email}</h3>
                <div className="flex items-baseline gap-3">
                  <span className="display text-3xl text-white">{balance}</span>
                  {hasSession && (
                    <span className="text-blush/60 text-xs">{timeLeft(submitter.session_end)}</span>
                  )}
                </div>
              </div>

              <form action={setSubmitterTelegram} className="flex flex-wrap items-end gap-2 mb-4">
                <input type="hidden" name="submitter_id" value={submitter.id} />
                <div className="flex-1 min-w-[10rem]">
                  <label className="label">Her Telegram chat ID</label>
                  <input name="telegram_chat_id" defaultValue={submitter.telegram_chat_id || ""}
                    placeholder={recentChats[0] ? `e.g. ${recentChats[0].id} (${recentChats[0].name})` : "Ask her to DM @Shortie_pts_bot first"}
                    className="input" />
                </div>
                <button className="btn-ghost">Save</button>
                {submitter.telegram_chat_id && (
                  <span className="text-rose-soft text-xs">✓ linked</span>
                )}
              </form>
              {!submitter.telegram_chat_id && recentChats.length > 0 && (
                <div className="mb-4 text-xs text-blush/60">
                  Recent bot chats (click to copy id):
                  <div className="flex flex-wrap gap-2 mt-1">
                    {recentChats.map((c) => (
                      <code key={c.id} className="px-2 py-1 rounded bg-white/5 text-blush">{c.id} · {c.name}</code>
                    ))}
                  </div>
                </div>
              )}

              <form action={setSession} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 mb-4">
                <input type="hidden" name="submitter_id" value={submitter.id} />
                <div>
                  <label className="label">Session start</label>
                  <input name="session_start" type="datetime-local"
                    defaultValue={toLocalInput(submitter.session_start)} className="input" />
                </div>
                <div>
                  <label className="label">Session end</label>
                  <input name="session_end" type="datetime-local"
                    defaultValue={toLocalInput(submitter.session_end)} className="input" />
                </div>
                <div className="self-end">
                  <button className="btn-ghost w-full">Save window</button>
                </div>
              </form>

              <div className="mb-4">
                <p className="label mb-2">Milestones</p>
                <div className="space-y-2 mb-2">
                  {milestones.map((m: any) => (
                    <form key={m.id} action={deleteMilestone} className="flex items-center gap-3 text-sm">
                      <input type="hidden" name="id" value={m.id} />
                      <span className="text-blush flex-1 truncate">{m.name}</span>
                      <span className="display text-lg text-white">{m.points}</span>
                      <button className="btn-ghost py-1 px-3 text-xs">Remove</button>
                    </form>
                  ))}
                </div>
                <form action={addMilestone} className="flex flex-wrap gap-2">
                  <input type="hidden" name="submitter_id" value={submitter.id} />
                  <input name="name" placeholder="Milestone name" className="input flex-1 min-w-[10rem]" required />
                  <input name="points" type="number" min={1} placeholder="Points" className="input w-28" required />
                  <button className="btn-ghost">Add</button>
                </form>
              </div>

              {hasSession ? (
                <PointsChart data={chart} milestones={milestones.map((m: any) => ({ id: m.id, name: m.name, points: m.points }))} />
              ) : (
                <p className="text-blush/50 text-sm">Set a session window to see the chart.</p>
              )}
            </div>
          );
        })}
      </>
    );
  }

  // submitter view
  const milestonesResp = await sb.from("milestones").select("*").eq("submitter_id", me.id).order("points");
  const milestones = milestonesResp.data || [];
  const balance = await getSessionBalance(me.id, me.session_start, me.session_end);
  const chart = await buildSessionChart(me.id, me.session_start, me.session_end);
  const hasSession = !!me.session_start && !!me.session_end;
  const { data: history } = await sb
    .from("submissions").select("*")
    .eq("submitter_id", me.id).order("created_at", { ascending: false }).limit(15);

  const nextMilestone = milestones.find((m: any) => balance < m.points);
  const highestReached = [...milestones].reverse().find((m: any) => balance >= m.points);

  return (
    <>
      <Nav role="submitter" />
      {!me.agreement_signed_at && (
        <Link href="/agreement" className="card mb-6 block text-center border-rose/40 hover:border-rose">
          <p className="text-xs uppercase tracking-[0.3em] text-rose-soft">Before we begin</p>
          <p className="display text-xl text-white mt-1">Sign the Sacred Scroll →</p>
        </Link>
      )}
      <div className="card text-center mb-6">
        <p className="label">Your points</p>
        <p className="display text-6xl sm:text-7xl text-white drop-shadow-[0_0_20px_rgba(214,90,122,0.6)]">{balance}</p>
        {hasSession && (
          <p className="text-blush/60 text-sm mt-2">{timeLeft(me.session_end)}</p>
        )}
        {highestReached && (
          <p className="text-rose-soft text-xs uppercase tracking-[0.2em] mt-2">Reached: {highestReached.name}</p>
        )}
        {nextMilestone && (
          <p className="text-blush/60 text-sm mt-1">{nextMilestone.points - balance} to <span className="text-blush">{nextMilestone.name}</span></p>
        )}
        <div className="flex gap-3 justify-center mt-5 flex-wrap">
          <Link href="/submit" className="btn-primary">Submit</Link>
          <Link href="/redeem" className="btn-ghost">Spend</Link>
        </div>
      </div>

      {milestones.length > 0 && (
        <div className="card mb-6">
          <p className="label mb-3">Milestones</p>
          <ul className="space-y-3">
            {milestones.map((m: any) => {
              const pct = Math.min(100, Math.round((balance / Math.max(m.points, 1)) * 100));
              return (
                <li key={m.id}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="text-blush">{m.name}</span>
                    <span className="text-blush/50">{Math.min(balance, m.points)} / {m.points}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full bg-rose" style={{ width: `${pct}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {hasSession && chart.length > 0 && (
        <div className="card mb-6">
          <PointsChart data={chart} milestones={milestones.map((m: any) => ({ id: m.id, name: m.name, points: m.points }))} />
        </div>
      )}

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
