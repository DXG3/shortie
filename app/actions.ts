"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseServer, supabaseAdmin, currentProfile } from "@/lib/supabase/server";

async function requireSubmitter() {
  const p = await currentProfile();
  if (!p) redirect("/login");
  return p;
}
async function requireAdmin() {
  const p = await currentProfile();
  if (!p || p.role !== "admin") redirect("/");
  return p;
}

export async function submitRequest(formData: FormData) {
  const p = await requireSubmitter();
  const requested = parseInt(String(formData.get("points") || "0"), 10);
  const reason = String(formData.get("reason") || "").trim();
  if (!requested || requested <= 0 || !reason) return;
  const sb = supabaseServer();
  await sb.from("submissions").insert({
    submitter_id: p.id,
    requested_points: requested,
    reason,
    status: "pending",
  });
  revalidatePath("/");
}

export async function decideSubmission(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const decision = String(formData.get("decision")); // approved | declined | amended
  const awarded = formData.get("awarded") ? parseInt(String(formData.get("awarded")), 10) : null;
  const note = String(formData.get("note") || "") || null;

  if (!["approved", "declined", "amended"].includes(decision)) return;
  const admin = await currentProfile();

  const sb = supabaseAdmin();
  const { data: sub } = await sb.from("submissions").select("*").eq("id", id).single();
  if (!sub) return;

  const finalPoints =
    decision === "declined" ? 0 :
    decision === "approved" ? sub.requested_points :
    (awarded ?? sub.requested_points);

  await sb.from("submissions").update({
    status: decision,
    awarded_points: decision === "declined" ? null : finalPoints,
    admin_note: note,
    decided_by: admin!.id,
    decided_at: new Date().toISOString(),
  }).eq("id", id);

  revalidatePath("/");
  revalidatePath("/admin/queue");
}

export async function upsertReward(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") ? String(formData.get("id")) : null;
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "") || null;
  const cost = parseInt(String(formData.get("cost") || "0"), 10);
  const active = formData.get("active") === "on";
  if (!name || !cost || cost <= 0) return;

  const sb = supabaseAdmin();
  if (id) {
    await sb.from("rewards").update({ name, description, cost, active }).eq("id", id);
  } else {
    await sb.from("rewards").insert({ name, description, cost, active });
  }
  revalidatePath("/admin/rewards");
  revalidatePath("/redeem");
}

export async function deleteReward(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const sb = supabaseAdmin();
  await sb.from("rewards").update({ active: false }).eq("id", id);
  revalidatePath("/admin/rewards");
  revalidatePath("/redeem");
}

export async function redeemReward(formData: FormData): Promise<void> {
  const p = await requireSubmitter();
  const rewardId = String(formData.get("reward_id"));
  const note = String(formData.get("note") || "") || null;

  const sb = supabaseAdmin();
  const { data: reward } = await sb.from("rewards").select("*").eq("id", rewardId).single();
  if (!reward || !reward.active) return;

  const { data: bal } = await sb.from("point_balances").select("balance").eq("submitter_id", p.id).single();
  if (!bal || bal.balance < reward.cost) return;

  await sb.from("redemptions").insert({
    submitter_id: p.id,
    reward_id: reward.id,
    cost_at_redemption: reward.cost,
    note,
  });
  revalidatePath("/");
  revalidatePath("/redeem");
}

export async function inviteUser(formData: FormData) {
  await requireAdmin();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const role = String(formData.get("role") || "submitter");
  if (!email) return;
  const admin = await currentProfile();
  const sb = supabaseAdmin();
  await sb.from("invites").upsert({ email, role, invited_by: admin!.id }, { onConflict: "email" });
  // Also send them a magic link so they can sign in straight away.
  await sb.auth.admin.inviteUserByEmail(email);
  revalidatePath("/admin/invites");
}

export async function signOut() {
  const sb = supabaseServer();
  await sb.auth.signOut();
  redirect("/login");
}
