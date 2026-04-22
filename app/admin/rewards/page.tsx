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

      <form action={upsertReward} className="card mb-6 space-y-3">
        <p className="label">Add a new reward</p>
        <div className="grid md:grid-cols-3 gap-3">
          <input name="name" placeholder="Name (e.g. Perfume)" required className="input" />
          <input name="cost" type="number" min={1} placeholder="Cost (points)" required className="input" />
          <label className="flex items-center gap-2 text-blush/80 text-sm">
            <input type="checkbox" name="active" defaultChecked /> Active
          </label>
        </div>
        <input name="description" placeholder="Description (optional)" className="input" />
        <button className="btn-primary">Add reward</button>
      </form>

      <div className="space-y-3">
        {(rewards || []).map((r: any) => (
          <form key={r.id} action={upsertReward} className="card flex flex-wrap items-center gap-3">
            <input type="hidden" name="id" value={r.id} />
            <input name="name" defaultValue={r.name} className="input flex-1 min-w-[10rem]" />
            <input name="cost" type="number" defaultValue={r.cost} className="input w-28" />
            <input name="description" defaultValue={r.description || ""} className="input flex-1 min-w-[14rem]" />
            <label className="flex items-center gap-2 text-blush/80 text-sm">
              <input type="checkbox" name="active" defaultChecked={r.active} /> Active
            </label>
            <button className="btn-ghost">Save</button>
            <button formAction={deleteReward} className="btn-ghost">Retire</button>
          </form>
        ))}
        {(rewards || []).length === 0 && <p className="text-blush/50">No rewards yet.</p>}
      </div>
    </>
  );
}
