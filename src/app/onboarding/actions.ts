"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { getCurrentProfile, homeForRole } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { BUSINESS_TYPES } from "@/lib/business-types";
import { notifySuperadmins } from "@/lib/webpush";

export type OnboardingState = {
  error: string;
  values: { name: string; businessType: string; address: string; phone: string };
} | null;

const PHONE_RE = /^[0-9+\-\s]{8,20}$/;

export async function createTenant(
  _prevState: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "owner") redirect(homeForRole(profile.role) ?? "/login");
  if (profile.tenantId) redirect("/dashboard");

  const name = String(formData.get("name") ?? "").trim();
  const businessType = String(formData.get("businessType") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  const pkg = String(formData.get("package") ?? "basic");

  const values = { name, businessType, address, phone };
  const fail = (error: string): OnboardingState => ({ error, values });

  if (pkg !== "basic" && pkg !== "pro") return fail("Pilih paket.");
  if (name.length < 2 || name.length > 80) return fail("Nama toko wajib diisi (2–80 karakter).");
  if (!BUSINESS_TYPES.includes(businessType)) return fail("Pilih jenis usaha.");
  if (address.length > 200) return fail("Alamat maksimal 200 karakter.");
  if (phone && !PHONE_RE.test(phone)) return fail("Nomor telepon tidak valid.");

  // Buat tenant + hubungkan ke owner dalam satu transaksi (paket pilihan, trial 14 hari).
  const { error } = await supabaseAdmin.rpc("create_tenant_for_owner", {
    p_user: profile.id,
    p_name: name,
    p_business_type: businessType,
    p_address: address || null,
    p_phone: phone || null,
    p_package: pkg,
  });
  if (error) return fail("Gagal membuat toko. Coba lagi.");

  after(() =>
    notifySuperadmins({
      title: "Tenant baru mendaftar",
      body: `${name} (${pkg === "pro" ? "Pro" : "Basic"})`,
      url: "/superadmin/tenants",
      tag: "tenant",
    }),
  );

  redirect("/dashboard");
}
