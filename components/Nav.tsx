import Link from "next/link";
import { signOut } from "@/app/actions";

export function Nav({ role }: { role: "admin" | "submitter" }) {
  return (
    <nav className="mb-8 flex flex-wrap items-center gap-2 justify-center">
      <Link href="/" className="btn-ghost">Home</Link>
      {role === "submitter" && <Link href="/submit" className="btn-ghost">Earn</Link>}
      <Link href="/redeem" className="btn-ghost">Spend</Link>
      <Link href="/agreement" className="btn-ghost">Scroll</Link>
      {role === "submitter" && <Link href="/setup" className="btn-ghost">Me</Link>}
      {role === "admin" && (
        <>
          <Link href="/admin/queue" className="btn-ghost">Queue</Link>
          <Link href="/admin/rewards" className="btn-ghost">Rewards</Link>
          <Link href="/admin/invites" className="btn-ghost">Invites</Link>
        </>
      )}
      <form action={signOut}>
        <button className="btn-ghost">Sign out</button>
      </form>
    </nav>
  );
}
