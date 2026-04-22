import { Nav } from "@/components/Nav";
import { currentProfile, supabaseAdmin } from "@/lib/supabase/server";
import { signAgreement } from "@/app/actions";
import { AGREEMENT, AGREEMENT_TITLE, SIGNING_PROMISE } from "@/lib/agreement";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

function fmt(ts: string) {
  return new Date(ts).toLocaleString();
}

export default async function AgreementPage() {
  const me = await currentProfile();
  if (!me) redirect("/login");

  const admin = supabaseAdmin();
  const { data: submitters } = me.role === "admin"
    ? await admin.from("profiles").select("id,email,display_name,agreement_signed_at,agreement_initials").eq("role", "submitter")
    : { data: null };

  return (
    <>
      <Nav role={me.role} />
      <article className="card space-y-6">
        <header className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-blush/50">Letter of Engagement</p>
          <h2 className="display text-3xl sm:text-4xl text-white mt-1">{AGREEMENT_TITLE}</h2>
        </header>

        <div className="space-y-5">
          {AGREEMENT.map((s, i) => (
            <section key={i}>
              <h3 className="display text-xl text-rose-soft" dangerouslySetInnerHTML={{ __html: `${i + 1}. ${s.heading}` }} />
              <p className="text-blush/80 mt-1 leading-relaxed" dangerouslySetInnerHTML={{ __html: s.body }} />
            </section>
          ))}
        </div>

        <hr className="border-white/10" />

        {me.role === "submitter" ? (
          me.agreement_signed_at ? (
            <div className="text-center space-y-2">
              <p className="display text-2xl text-white">Signed</p>
              <p className="text-blush/80">
                {me.agreement_initials} · {fmt(me.agreement_signed_at)}
              </p>
              <p className="text-blush/50 text-sm italic">Kneeling acknowledged.</p>
            </div>
          ) : (
            <form action={signAgreement} className="space-y-4 max-w-md mx-auto">
              <p className="text-blush/80 italic text-sm leading-relaxed">{SIGNING_PROMISE}</p>
              <div>
                <label className="label">Your initials</label>
                <input name="initials" required minLength={2} maxLength={5}
                  className="input uppercase tracking-[0.4em] text-center text-lg"
                  placeholder="K" />
              </div>
              <button className="btn-primary w-full">I solemnly agree</button>
            </form>
          )
        ) : (
          <div className="space-y-2">
            <p className="label mb-2">Signatures</p>
            {(submitters || []).length === 0 && <p className="text-blush/50 text-sm">No submitters yet.</p>}
            {(submitters || []).map((s: any) => (
              <div key={s.id} className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-blush">{s.display_name || s.email}</span>
                {s.agreement_signed_at ? (
                  <span className="text-blush/80 text-sm">
                    {s.agreement_initials} · {fmt(s.agreement_signed_at)}
                  </span>
                ) : (
                  <span className="pill-pending">unsigned</span>
                )}
              </div>
            ))}
          </div>
        )}
      </article>
    </>
  );
}
