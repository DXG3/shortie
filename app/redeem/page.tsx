import { Nav } from "@/components/Nav";
import { redeemReward } from "@/app/actions";
import { currentProfile, supabaseAdmin, supabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function RedeemPage() {
  const me = await currentProfile();
  if (!me) redirect("/login");

  const sb = supabaseServer();
  const { data: rewards } = await sb.from("rewards").select("*").eq("active", true).order("cost");

  const admin = supabaseAdmin();
  let balance = 0;
  if (me.role === "submitter") {
    const { data: b } = await admin.from("point_balances").select("balance").eq("submitter_id", me.id).single();
    balance = b?.balance ?? 0;
  }

  return (
    <>
      <Nav role={me.role} />
      {me.role === "submitter" && (
        <div className="card text-center mb-6">
          <p className="label">Your balance</p>
          <p className="display text-5xl text-white">{balance}</p>
        </div>
      )}
      <div className="grid md:grid-cols-2 gap-4">
        {(rewards || []).map((r: any) => {
          const canAfford = me.role === "submitter" && balance >= r.cost;
          return (
            <div key={r.id} className="card">
              <div className="flex items-start justify-between gap-3">
                <h3 className="display text-2xl text-white">{r.name}</h3>
                <span className="pill-approved">{r.cost} pts</span>
              </div>
              {me.role === "submitter" && (
                <form action={redeemReward} className="mt-4 space-y-2">
                  <input type="hidden" name="reward_id" value={r.id} />
                  <input name="note" className="input" placeholder="Note (optional)" />
                  <button className="btn-primary w-full" disabled={!canAfford}>
                    {canAfford ? "Redeem" : `Need ${r.cost - balance} more`}
                  </button>
                </form>
              )}
            </div>
          );
        })}
        {(rewards || []).length === 0 && <p className="text-blush/50">No rewards yet.</p>}
      </div>
    </>
  );
}
