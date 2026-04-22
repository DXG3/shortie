import { Nav } from "@/components/Nav";
import { upsertReward, deleteReward } from "@/app/actions";
import { currentProfile, supabaseAdmin } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function RewardsAdminPage() {
  const me = await currentProfile();
  if (!me || me.role !== "admin") redirect("/");

  const sb = supabaseAdmin();
  const { data: rewards } = await sb.from("rewards").select("*").order("created_at", { ascending: false });

  return (
    <>
      <Nav role="admin" />
      <h2 className="display text-3xl text-white mb-6">Rewards catalogue</h2>

      <form action={upsertReward} className="card mb-6 flex flex-wrap items-center gap-3">
        <input name="name" placeholder="Name" required className="input flex-1 min-w-[10rem]" />
        <input name="cost" type="number" min={1} placeholder="Cost" required className="input w-24" />
        <label className="flex items-center gap-2 text-blush/80 text-sm">
          <input type="checkbox" name="active" defaultChecked /> Active
        </label>
        <button className="btn-primary">Add</button>
      </form>

      <div className="space-y-2">
        {(rewards || []).map((r: any) => (
          <form key={r.id} action={upsertReward} className="card flex flex-wrap items-center gap-3 py-3">
            <input type="hidden" name="id" value={r.id} />
            <input name="name" defaultValue={r.name} className="input flex-1 min-w-[8rem]" />
            <input name="cost" type="number" defaultValue={r.cost} className="input w-20" />
            <label className="flex items-center gap-2 text-blush/80 text-sm">
              <input type="checkbox" name="active" defaultChecked={r.active} /> Active
            </label>
            <div className="flex gap-2 ml-auto">
              <button className="btn-ghost py-1.5 px-3 text-sm">Save</button>
              <button formAction={deleteReward} className="btn-ghost py-1.5 px-3 text-sm">Retire</button>
            </div>
          </form>
        ))}
        {(rewards || []).length === 0 && <p className="text-blush/50">No rewards yet.</p>}
      </div>
    </>
  );
}
