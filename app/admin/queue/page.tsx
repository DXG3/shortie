import { Nav } from "@/components/Nav";
import { decideSubmission } from "@/app/actions";
import { currentProfile, supabaseAdmin } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function QueuePage() {
  const me = await currentProfile();
  if (!me || me.role !== "admin") redirect("/");

  const sb = supabaseAdmin();
  const { data: pending } = await sb
    .from("submissions")
    .select("*, profiles!submissions_submitter_id_fkey(email,display_name)")
    .eq("status", "pending")
    .order("created_at");

  return (
    <>
      <Nav role="admin" />
      <h2 className="display text-3xl text-white mb-6">Pending requests</h2>
      {pending && pending.length ? (
        <div className="space-y-4">
          {pending.map((s: any) => (
            <form key={s.id} action={decideSubmission} className="card">
              <input type="hidden" name="id" value={s.id} />
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="text-blush/60 text-xs">
                    {s.profiles?.display_name || s.profiles?.email} · {new Date(s.created_at).toLocaleString()}
                  </p>
                  <p className="text-xs uppercase tracking-[0.2em] text-rose-soft mt-1">
                    {s.kind === "offer" ? "willing to do" : "feels she deserves"}
                  </p>
                  <p className="text-blush mt-1">{s.reason}</p>
                </div>
                <p className="display text-4xl text-white">{s.requested_points}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input name="awarded" type="number" placeholder="Amend to…" className="input" />
                <input name="note" placeholder="Note (optional)" className="input sm:col-span-2" />
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3">
                <button name="decision" value="approved" className="btn-primary">Approve</button>
                <button name="decision" value="amended" className="btn-ghost">Amend</button>
                <button name="decision" value="declined" className="btn-ghost">Decline</button>
              </div>
            </form>
          ))}
        </div>
      ) : (
        <p className="text-blush/50">No pending requests.</p>
      )}
    </>
  );
}
