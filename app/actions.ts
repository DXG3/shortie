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
  const kind = String(formData.get("kind") || "claim");
  if (!requested || requested <= 0 || !reason) return;
  if (!["claim", "offer"].includes(kind)) return;
  const sb = supabaseServer();
  await sb.from("submissions").insert({
    submitter_id: p.id,
    requested_points: requested,
    reason,
    kind,
    status: "pending",
  });
  const who = p.nickname || p.display_name || p.email;
  const verb = kind === "claim" ? "feels she deserves" : "offers to earn";
  await notifyAdmin(`*New request*\n\n*${who}* ${verb} *${requested}* points:\n_${reason}_`);
  revalidatePath("/");
}

async function telegramSend(chatId: string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || !chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
    });
  } catch {}
}

async function notifyAdmin(text: string) {
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!chatId) return;
  await telegramSend(chatId, text);
}

async function notifySubmitterOfDecision(submitterId: string, decision: string, points: number, note: string | null) {
  const sb = supabaseAdmin();
  const { data: p } = await sb.from("profiles").select("telegram_chat_id,display_name,email").eq("id", submitterId).single();
  if (!p?.telegram_chat_id) return;
  let text = "";
  if (decision === "approved") text = `*Approved* — you&#39;ve been awarded *${points}* points. Good girl.`;
  else if (decision === "amended") text = `*Amended* — you&#39;ve been awarded *${points}* points.`;
  else if (decision === "declined") text = `*Declined* — no points this time.`;
  if (note) text += `\n_${note}_`;
  await telegramSend(p.telegram_chat_id, text);
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

  await notifySubmitterOfDecision(sub.submitter_id, decision, finalPoints, note);

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

export async function redeemForSubmitter(formData: FormData): Promise<void> {
  await requireAdmin();
  const submitterId = String(formData.get("submitter_id"));
  const rewardId = String(formData.get("reward_id"));
  const note = String(formData.get("note") || "") || null;
  if (!submitterId || !rewardId) return;

  const sb = supabaseAdmin();
  const { data: reward } = await sb.from("rewards").select("*").eq("id", rewardId).single();
  if (!reward || !reward.active) return;

  const { data: bal } = await sb.from("point_balances").select("balance").eq("submitter_id", submitterId).single();
  if (!bal || bal.balance < reward.cost) return;

  await sb.from("redemptions").insert({
    submitter_id: submitterId,
    reward_id: reward.id,
    cost_at_redemption: reward.cost,
    note,
  });
  revalidatePath("/");
  revalidatePath("/redeem");
}

export async function redeemReward(formData: FormData): Promise<void> {
  const p = await requireSubmitter();
  const rewardId = String(formData.get("reward_id"));
  const note = String(formData.get("note") || "") || null;

  const sb = supabaseAdmin();
  const { data: reward } = await sb.from("rewards").select("*").eq("id", rewardId).single();
  if (!reward || !reward.active) return;

  // session-scoped affordability check
  const { getSessionBalance } = await import("@/lib/points");
  const bal = await getSessionBalance(p.id, p.session_start, p.session_end);
  if (bal < reward.cost) return;

  await sb.from("redemptions").insert({
    submitter_id: p.id,
    reward_id: reward.id,
    cost_at_redemption: reward.cost,
    note,
  });
  const who = p.nickname || p.display_name || p.email;
  let msg = `*Spent*\n\n*${who}* redeemed *${reward.name}* for *${reward.cost}* pts.`;
  if (note) msg += `\n_${note}_`;
  await notifyAdmin(msg);
  revalidatePath("/");
  revalidatePath("/redeem");
}

export async function setSession(formData: FormData) {
  await requireAdmin();
  const submitterId = String(formData.get("submitter_id"));
  const start = String(formData.get("session_start") || "") || null;
  const end = String(formData.get("session_end") || "") || null;
  if (!submitterId) return;
  const sb = supabaseAdmin();
  await sb.from("profiles").update({
    session_start: start ? new Date(start).toISOString() : null,
    session_end: end ? new Date(end).toISOString() : null,
  }).eq("id", submitterId);
  revalidatePath("/");
  revalidatePath("/redeem");
}

export async function addMilestone(formData: FormData) {
  await requireAdmin();
  const submitterId = String(formData.get("submitter_id"));
  const name = String(formData.get("name") || "").trim();
  const points = parseInt(String(formData.get("points") || "0"), 10);
  if (!submitterId || !name || !points || points <= 0) return;
  const sb = supabaseAdmin();
  await sb.from("milestones").insert({ submitter_id: submitterId, name, points });
  revalidatePath("/");
}

export async function deleteMilestone(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  if (!id) return;
  const sb = supabaseAdmin();
  await sb.from("milestones").delete().eq("id", id);
  revalidatePath("/");
}

export async function setPointsTarget(formData: FormData) {
  await requireAdmin();
  const submitterId = String(formData.get("submitter_id"));
  const target = parseInt(String(formData.get("target") || "1"), 10);
  if (!submitterId || !Number.isFinite(target) || target < 1) return;
  const sb = supabaseAdmin();
  await sb.from("profiles").update({ points_target: target }).eq("id", submitterId);
  revalidatePath("/");
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

export async function askForReward(formData: FormData) {
  const me = await requireSubmitter();
  const name = String(formData.get("name") || "").trim();
  const suggestedCost = String(formData.get("suggested_cost") || "").trim();
  const note = String(formData.get("note") || "").trim();
  if (!name) return;
  const who = me.nickname || me.display_name || me.email;
  const parts = [`*Reward wish*`, ``, `*${who}* would like: *${name}*`];
  if (suggestedCost) parts.push(`Suggested cost: *${suggestedCost}*`);
  if (note) parts.push(`_${note}_`);
  await notifyAdmin(parts.join("\n"));
  revalidatePath("/redeem");
}

export async function signAgreement(formData: FormData) {
  const me = await requireSubmitter();
  const initials = String(formData.get("initials") || "").trim().toUpperCase();
  if (!initials || initials.length < 2 || initials.length > 5) return;
  const sb = supabaseAdmin();
  await sb.from("profiles").update({
    agreement_signed_at: new Date().toISOString(),
    agreement_initials: initials,
  }).eq("id", me.id);
  revalidatePath("/agreement");
  revalidatePath("/");
}

export async function awardPoints(formData: FormData) {
  await requireAdmin();
  const admin = await currentProfile();
  const submitterId = String(formData.get("submitter_id"));
  const points = parseInt(String(formData.get("points") || "0"), 10);
  const reason = String(formData.get("reason") || "").trim();
  if (!submitterId || !points || !reason) return;
  const sb = supabaseAdmin();
  await sb.from("submissions").insert({
    submitter_id: submitterId,
    requested_points: Math.abs(points),
    awarded_points: points,
    reason,
    kind: "claim",
    status: points >= 0 ? "approved" : "amended",
    decided_by: admin!.id,
    decided_at: new Date().toISOString(),
  });
  await notifySubmitterOfDecision(submitterId, points >= 0 ? "approved" : "amended", points, reason);
  revalidatePath("/");
}

export async function setSubmitterProfile(formData: FormData) {
  const me = await requireSubmitter();
  const nickname = String(formData.get("nickname") || "").trim() || null;
  const safeWord = String(formData.get("safe_word") || "").trim() || null;
  const chatId = String(formData.get("telegram_chat_id") || "").trim() || null;
  const sb = supabaseAdmin();
  await sb.from("profiles").update({
    nickname, safe_word: safeWord, telegram_chat_id: chatId,
  }).eq("id", me.id);
  if (chatId) {
    await telegramSend(chatId, `You&#39;re linked. You&#39;ll get pings here when he decides on your requests. Good girl.`);
  }
  revalidatePath("/");
  revalidatePath("/setup");
}

export async function setSubmitterTelegram(formData: FormData) {
  await requireAdmin();
  const submitterId = String(formData.get("submitter_id"));
  const chatId = String(formData.get("telegram_chat_id") || "").trim() || null;
  if (!submitterId) return;
  const sb = supabaseAdmin();
  await sb.from("profiles").update({ telegram_chat_id: chatId }).eq("id", submitterId);
  if (chatId) {
    await telegramSend(chatId, "You&#39;re linked. You&#39;ll get a ping here when I decide on your requests. Good girl.");
  }
  revalidatePath("/");
}

export async function deleteUser(formData: FormData) {
  await requireAdmin();
  const me = await currentProfile();
  const userId = String(formData.get("user_id") || "");
  if (!userId) return;
  if (me && userId === me.id) return; // never delete self

  const sb = supabaseAdmin();
  // Also clear the invite row so the email can be re-invited cleanly.
  const { data: p } = await sb.from("profiles").select("email").eq("id", userId).single();
  if (p?.email) await sb.from("invites").delete().eq("email", p.email);
  // Delete from auth — profile row cascades via on delete cascade.
  await sb.auth.admin.deleteUser(userId);
  revalidatePath("/admin/users");
  revalidatePath("/admin/invites");
  revalidatePath("/");
}

export async function setAppTitle(formData: FormData) {
  await requireAdmin();
  const title = String(formData.get("title") || "").trim();
  if (!title || title.length > 60) return;
  const sb = supabaseAdmin();
  await sb.from("app_settings").upsert({ key: "title", value: title, updated_at: new Date().toISOString() });
  revalidatePath("/", "layout");
}

export async function signOut() {
  const sb = supabaseServer();
  await sb.auth.signOut();
  redirect("/login");
}
