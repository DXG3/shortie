import { supabaseAdmin } from "@/lib/supabase/server";

export type ChartPoint = { label: string; net: number; running: number };

function pad(n: number) { return n.toString().padStart(2, "0"); }

function formatBucket(d: Date, hourly: boolean) {
  if (hourly) return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}h`;
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
}

/** Builds session-scoped chart. Returns empty array if no window set. */
export async function buildSessionChart(
  submitterId: string,
  sessionStart: string | null,
  sessionEnd: string | null,
): Promise<ChartPoint[]> {
  if (!sessionStart || !sessionEnd) return [];
  const startMs = new Date(sessionStart).getTime();
  const endMs = new Date(sessionEnd).getTime();
  if (!(endMs > startMs)) return [];

  const durationHours = (endMs - startMs) / 3_600_000;
  const hourly = durationHours <= 72;
  const stepMs = hourly ? 3_600_000 : 86_400_000;

  const sb = supabaseAdmin();
  const [{ data: subs }, { data: reds }] = await Promise.all([
    sb.from("submissions").select("created_at,awarded_points")
      .eq("submitter_id", submitterId)
      .in("status", ["approved", "amended"])
      .gte("created_at", new Date(startMs).toISOString())
      .lt("created_at", new Date(endMs).toISOString()),
    sb.from("redemptions").select("created_at,cost_at_redemption")
      .eq("submitter_id", submitterId)
      .gte("created_at", new Date(startMs).toISOString())
      .lt("created_at", new Date(endMs).toISOString()),
  ]);

  const bucketed = new Map<number, number>();
  const bucketKey = (t: number) => {
    const d = new Date(t);
    if (hourly) {
      return new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()).getTime();
    }
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  };

  for (const r of subs || []) {
    const k = bucketKey(new Date(r.created_at).getTime());
    bucketed.set(k, (bucketed.get(k) || 0) + (r.awarded_points || 0));
  }
  for (const r of reds || []) {
    const k = bucketKey(new Date(r.created_at).getTime());
    bucketed.set(k, (bucketed.get(k) || 0) - (r.cost_at_redemption || 0));
  }

  const points: ChartPoint[] = [];
  let running = 0;
  const firstBucket = bucketKey(startMs);
  const lastBucket = bucketKey(endMs - 1);
  for (let t = firstBucket; t <= lastBucket; t += stepMs) {
    const net = bucketed.get(t) || 0;
    running += net;
    points.push({ label: formatBucket(new Date(t), hourly), net, running });
  }
  return points;
}

/** Current session balance (defaults to 0 if session unset). */
export async function getSessionBalance(
  submitterId: string,
  sessionStart: string | null,
  sessionEnd: string | null,
): Promise<number> {
  if (!sessionStart) return 0;
  const startIso = new Date(sessionStart).toISOString();
  const endIso = sessionEnd ? new Date(sessionEnd).toISOString() : new Date().toISOString();

  const sb = supabaseAdmin();
  const [{ data: subs }, { data: reds }] = await Promise.all([
    sb.from("submissions").select("awarded_points")
      .eq("submitter_id", submitterId)
      .in("status", ["approved", "amended"])
      .gte("created_at", startIso).lt("created_at", endIso),
    sb.from("redemptions").select("cost_at_redemption")
      .eq("submitter_id", submitterId)
      .gte("created_at", startIso).lt("created_at", endIso),
  ]);
  const earned = (subs || []).reduce((s: number, r: any) => s + (r.awarded_points || 0), 0);
  const spent = (reds || []).reduce((s: number, r: any) => s + (r.cost_at_redemption || 0), 0);
  return earned - spent;
}

/** Convert a timestamptz string to `yyyy-MM-ddTHH:mm` in the server's local tz for <input type=datetime-local>. */
export function toLocalInput(ts: string | null): string {
  if (!ts) return "";
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
