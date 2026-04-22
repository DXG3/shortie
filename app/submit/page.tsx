import { Nav } from "@/components/Nav";
import { submitRequest } from "@/app/actions";
import { currentProfile } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SubmitForm } from "./SubmitForm";

export default async function SubmitPage() {
  const me = await currentProfile();
  if (!me) redirect("/login");
  if (me.role !== "submitter") redirect("/");

  return (
    <>
      <Nav role="submitter" />
      <div className="card max-w-xl mx-auto">
        <h2 className="display text-3xl text-white mb-1">Submit for points</h2>
        <p className="text-blush/60 text-sm mb-6">Be honest — I&apos;ll know.</p>
        <SubmitForm action={submitRequest} />
      </div>
    </>
  );
}
