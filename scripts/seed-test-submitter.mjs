import { createClient } from "@supabase/supabase-js";

const url = "https://hbmffokwhewrzkbdouxk.supabase.co";
const serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhibWZmb2t3aGV3cnprYmRvdXhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njg3NTkzMiwiZXhwIjoyMDkyNDUxOTMyfQ.gbWB0uTr1UIJ-2Had1l97Yx7hehSylGXOOOiVBJzKVE";

const sb = createClient(url, serviceKey, { auth: { persistSession: false } });

const email = "test-kitten@shortie.local";

const { data: existing } = await sb.from("profiles").select("*").eq("email", email).maybeSingle();
if (existing) {
  console.log("Already seeded:", existing.id);
  process.exit(0);
}

await sb.from("invites").upsert({ email, role: "submitter" }, { onConflict: "email" });

const { data, error } = await sb.auth.admin.createUser({
  email,
  email_confirm: true,
  user_metadata: { test: true, display_name: "Test Kitten" },
});
if (error) { console.error(error); process.exit(1); }

const uid = data.user.id;
await sb.from("profiles").update({ display_name: "Test Kitten" }).eq("id", uid);

// give her a session window (next 60 hours) and 3 milestones
const now = new Date();
const end = new Date(now.getTime() + 60 * 3_600_000);
await sb.from("profiles").update({
  session_start: now.toISOString(),
  session_end: end.toISOString(),
}).eq("id", uid);

await sb.from("milestones").insert([
  { submitter_id: uid, name: "warm-up", points: 10 },
  { submitter_id: uid, name: "the edge", points: 25 },
  { submitter_id: uid, name: "good girl", points: 50 },
]);

// a couple of approved submissions so the chart isn't empty
const old = (h) => new Date(Date.now() - h * 3_600_000).toISOString();
await sb.from("submissions").insert([
  { submitter_id: uid, requested_points: 5, awarded_points: 5, reason: "made the bed", status: "approved", kind: "claim", created_at: old(12), decided_at: old(11) },
  { submitter_id: uid, requested_points: 10, awarded_points: 10, reason: "good behaviour", status: "approved", kind: "claim", created_at: old(6), decided_at: old(5) },
  { submitter_id: uid, requested_points: 8, awarded_points: 8, reason: "promised to be still", status: "approved", kind: "offer", created_at: old(2), decided_at: old(1) },
]);

console.log("Seeded:", email, uid);
