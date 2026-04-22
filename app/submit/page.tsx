import { Nav } from "@/components/Nav";
import { submitRequest } from "@/app/actions";
import { currentProfile } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function SubmitPage() {
  const me = await currentProfile();
  if (!me) redirect("/login");
  if (me.role !== "submitter") redirect("/");

  return (
    <>
      <Nav role="submitter" />
      <div className="card max-w-xl mx-auto">
        <h2 className="display text-3xl text-white mb-1">Submit for points</h2>
        <p className="text-blush/60 text-sm mb-6">Tell me what you did. Be honest — I&apos;ll know.</p>
        <form action={submitRequest} className="space-y-4">
          <div>
            <label className="label">Points requested</label>
            <input name="points" type="number" min={1} required className="input" />
          </div>
          <div>
            <label className="label">Reason</label>
            <textarea name="reason" required rows={5} className="input" placeholder="What did you do to earn them?" />
          </div>
          <button className="btn-primary w-full">Send for approval</button>
        </form>
      </div>
    </>
  );
}
