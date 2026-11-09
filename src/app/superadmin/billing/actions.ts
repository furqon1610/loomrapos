"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function back(error?: string): never {
  revalidatePath("/superadmin/billing");
  revalidatePath("/superadmin");
  redirect(error ? `/superadmin/billing?error=${encodeURIComponent(error)}` : "/superadmin/billing");
}

export async function approvePayment(formData: FormData) {
  const admin = await requireRole(["superadmin"]);
  const id = String(formData.get("id") ?? "");
  if (!UUID_RE.test(id)) back("ID pembayaran tidak valid.");

  const { error } = await supabaseAdmin.rpc("approve_subscription_payment", {
    p_payment: id,
    p_reviewer: admin.id,
  });

  if (error) {
    if (error.message.includes("payment_not_pending")) back("Pembayaran ini sudah diproses.");
    if (error.message.includes("tenant_locked")) back("Tenant sedang dikunci manual.");
    back("Gagal menyetujui pembayaran.");
  }
  back();
}

export async function rejectPayment(formData: FormData) {
  const admin = await requireRole(["superadmin"]);
  const id = String(formData.get("id") ?? "");
  const note = String(formData.get("note") ?? "").trim().slice(0, 200);
  if (!UUID_RE.test(id)) back("ID pembayaran tidak valid.");
  if (!note) back("Isi alasan penolakan.");

  const { data, error } = await supabaseAdmin
    .from("subscription_payments")
    .update({
      status: "rejected",
      review_note: note,
      reviewed_by: admin.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "pending")
    .select("id");

  if (error) back("Gagal menolak pembayaran.");
  if (!data || data.length === 0) back("Pembayaran ini sudah diproses.");
  back();
}
