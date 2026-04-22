import { Nav } from "@/components/Nav";
import { inviteUser } from "@/app/actions";
import { currentProfile, supabaseAdmin } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function InvitesPage() {
  const me = await currentProfile();
  if (!me || me.role !== "admin") redirect("/");

  const sb = supabaseAdmin();
  const { data: invites } = await sb.from("invites").select("*").order("created_at", { ascending: false });

  return (
    <>
      <Nav role="admin" />
      <h2 className="display text-3xl text-white mb-6">Invites</h2>

      <form action={inviteUser} className="card mb-6 grid md:grid-cols-3 gap-3 items-end">
        <div>
          <label className="label">Email</label>
          <input name="email" type="email" required className="input" />
        </div>
        <div>
          <label className="label">Role</label>
          <select name="role" className="input" defaultValue="submitter">
            <option value="submitter">Submitter</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button className="btn-primary">Send invite</button>
      </form>

      <div className="space-y-2">
        {(invites || []).map((i: any) => (
          <div key={i.id} className="card flex items-center justify-between py-4">
            <div>
              <p className="text-blush">{i.email}</p>
              <p className="text-blush/50 text-xs">role: {i.role}</p>
            </div>
            <span className={i.used_at ? "pill-approved" : "pill-pending"}>
              {i.used_at ? "accepted" : "pending"}
            </span>
          </div>
        ))}
        {(invites || []).length === 0 && <p className="text-blush/50">No invites yet.</p>}
      </div>
    </>
  );
}
