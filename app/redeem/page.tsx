import { Nav } from "@/components/Nav";
import { redeemReward, redeemForSubmitter, askForReward } from "@/app/actions";
import { currentProfile, supabaseAdmin, supabaseServer } from "@/lib/supabase/server";
import { getSessionBalance } from "@/lib/points";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function RedeemPage({ searchParams }: { searchParams: { for?: string } }) {
  const me = await currentProfile();
  if (!me) redirect("/login");

  const sb = supabaseServer();
  const admin = supabaseAdmin();
  const { data: rewards } = await sb.from("rewards").select("*").eq("active", true).order("cost");

  if (me.role === "submitter") {
    const balance = await getSessionBalance(me.id, me.session_start, me.session_end);
    return (
      <>
        <Nav role="submitter" />
        <div className="card text-center mb-6">
          <p className="label">Your balance</p>
          <p className="display text-5xl sm:text-6xl text-white">{balance}</p>
        </div>
        <RewardGrid
          rewards={rewards || []}
          balance={balance}
          submitterId={me.id}
          action={redeemReward}
          includeSubmitterIdField={false}
        />

        <div className="card mt-6">
          <p className="label mb-2">Don&apos;t see what you want?</p>
          <p className="text-blush/60 text-sm mb-4">Ask for something new. He&apos;ll decide if it makes the catalogue.</p>
          <form action={askForReward} className="space-y-3">
            <div className="grid sm:grid-cols-[1fr_8rem] gap-3">
              <input name="name" required placeholder="What are you asking for?" className="input" />
              <input name="suggested_cost" placeholder="Suggested pts" className="input" />
            </div>
            <textarea name="note" rows={3} className="input" placeholder="A little note (optional)" />
            <button className="btn-ghost w-full">Send wish</button>
          </form>
        </div>
      </>
    );
  }

  // admin: pick a submitter, then spend on her behalf
  const { data: submitters } = await admin.from("profiles").select("*").eq("role", "submitter").order("created_at");
  const balanceEntries = await Promise.all(
    (submitters || []).map(async (s: any) => [s.id, await getSessionBalance(s.id, s.session_start, s.session_end)] as const),
  );
  const balMap = new Map<string, number>(balanceEntries);

  const selectedId = searchParams.for && (submitters || []).some((s: any) => s.id === searchParams.for)
    ? searchParams.for
    : (submitters?.[0]?.id ?? null);
  const selected = (submitters || []).find((s: any) => s.id === selectedId);
  const balance = selected ? (balMap.get(selected.id) ?? 0) : 0;

  return (
    <>
      <Nav role="admin" />
      {(submitters || []).length === 0 ? (
        <p className="text-blush/50">No submitters yet. <Link href="/admin/invites" className="underline">Invite one.</Link></p>
      ) : (
        <>
          <div className="card mb-6">
            <p className="label mb-3">Spend for</p>
            <div className="flex flex-wrap gap-2">
              {(submitters || []).map((s: any) => (
                <Link key={s.id} href={`/redeem?for=${s.id}`}
                  className={`pill ${selectedId === s.id ? "pill-approved" : "pill-pending"} cursor-pointer`}>
                  {s.display_name || s.email} · {balMap.get(s.id) ?? 0}
                </Link>
              ))}
            </div>
            {selected && (
              <div className="mt-5 text-center">
                <p className="label">{selected.display_name || selected.email} has</p>
                <p className="display text-5xl sm:text-6xl text-white">{balance}</p>
                <p className="text-blush/60 text-sm mt-1">points to spend</p>
              </div>
            )}
          </div>
          {selected && (
            <RewardGrid
              rewards={rewards || []}
              balance={balance}
              submitterId={selected.id}
              action={redeemForSubmitter}
              includeSubmitterIdField={true}
            />
          )}
        </>
      )}
    </>
  );
}

function RewardGrid({
  rewards, balance, submitterId, action, includeSubmitterIdField,
}: {
  rewards: any[];
  balance: number;
  submitterId: string;
  action: (fd: FormData) => Promise<void>;
  includeSubmitterIdField: boolean;
}) {
  if (!rewards.length) return <p className="text-blush/50">No rewards yet.</p>;
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {rewards.map((r) => {
        const canAfford = balance >= r.cost;
        return (
          <div key={r.id} className="card">
            <div className="flex items-start justify-between gap-3">
              <h3 className="display text-2xl text-white">{r.name}</h3>
              <span className="pill-approved">{r.cost} pts</span>
            </div>
            <form action={action} className="mt-4 space-y-2">
              <input type="hidden" name="reward_id" value={r.id} />
              {includeSubmitterIdField && <input type="hidden" name="submitter_id" value={submitterId} />}
              <input name="note" className="input" placeholder="Note (optional)" />
              <button className="btn-primary w-full" disabled={!canAfford}>
                {canAfford ? "Redeem" : `Need ${r.cost - balance} more`}
              </button>
            </form>
          </div>
        );
      })}
    </div>
  );
}
