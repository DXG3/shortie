import { Nav } from "@/components/Nav";
import { deleteUser, setAppTitle } from "@/app/actions";
import { currentProfile, supabaseAdmin } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const me = await currentProfile();
  if (!me || me.role !== "admin") redirect("/");

  const sb = supabaseAdmin();
  const [{ data: users }, { data: titleRow }] = await Promise.all([
    sb.from("profiles").select("id,email,display_name,nickname,role,created_at").order("created_at"),
    sb.from("app_settings").select("value").eq("key", "title").single(),
  ]);
  const title = titleRow?.value || "Miss Sheridan";

  return (
    <>
      <Nav role="admin" />
      <h2 className="display text-3xl text-white mb-6">Users</h2>

      <form action={setAppTitle} className="card mb-6 grid md:grid-cols-[1fr_auto] gap-3 items-end">
        <div>
          <label className="label">Header title</label>
          <input name="title" required maxLength={60} defaultValue={title} className="input" />
          <p className="text-blush/50 text-xs mt-1">Shown on every page (currently: <span className="text-blush">{title}</span>).</p>
        </div>
        <button className="btn-primary">Save title</button>
      </form>

      <div className="space-y-2">
        {(users || []).map((u: any) => {
          const isSelf = u.id === me.id;
          const name = u.nickname || u.display_name || u.email;
          return (
            <div key={u.id} className="card flex items-center justify-between py-4">
              <div>
                <p className="text-blush">{name}</p>
                <p className="text-blush/50 text-xs">{u.email} · role: {u.role}{isSelf ? " · you" : ""}</p>
              </div>
              {!isSelf && (
                <form action={deleteUser}>
                  <input type="hidden" name="user_id" value={u.id} />
                  <button
                    className="btn-ghost text-rose"
                    type="submit"
                    formNoValidate
                  >
                    Delete
                  </button>
                </form>
              )}
            </div>
          );
        })}
        {(users || []).length === 0 && <p className="text-blush/50">No users yet.</p>}
      </div>
    </>
  );
}
