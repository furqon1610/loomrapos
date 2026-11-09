import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, homeForRole, type CurrentProfile, type Role } from "@/lib/auth";
import { getTenantAccess, type Access, type TenantRow } from "@/lib/billing";

const loadContext = cache(async () => {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  if (!profile.tenantId) {
    return { profile, tenant: null as TenantRow | null, hasPending: false };
  }

  const supabase = await createClient();
  const [tenantRes, pendingRes] = await Promise.all([
    supabase.from("tenants").select("*").eq("id", profile.tenantId).maybeSingle(),
    supabase
      .from("subscription_payments")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", profile.tenantId)
      .eq("status", "pending"),
  ]);

  return {
    profile,
    tenant: (tenantRes.data as TenantRow | null) ?? null,
    hasPending: (pendingRes.count ?? 0) > 0,
  };
});

async function requireContext(allowed: Role[]) {
  const ctx = await loadContext();
  if (!ctx) redirect("/login");
  if (!allowed.includes(ctx.profile.role)) {
    redirect(homeForRole(ctx.profile.role) ?? "/login");
  }
  return ctx;
}

/** Owner + tokonya. Owner yang belum punya toko diarahkan ke onboarding. */
export async function getOwnerContext() {
  const ctx = await requireContext(["owner"]);
  if (!ctx.tenant) redirect("/onboarding");
  return {
    profile: ctx.profile,
    tenant: ctx.tenant,
    hasPending: ctx.hasPending,
    access: getTenantAccess(ctx.tenant, ctx.hasPending),
  };
}

/** Alasan akun belum boleh bertransaksi, atau null kalau boleh. */
function blockReason(role: Role, tenant: TenantRow | null, access: Access | null): string | null {
  if (!tenant) return "Akun ini belum terhubung ke toko. Hubungi owner.";
  if (!access?.ok) {
    return role === "owner"
      ? "Langganan tidak aktif. Aktifkan dulu di menu Langganan."
      : "Langganan toko sedang tidak aktif. Hubungi owner.";
  }
  if (role === "cashier" && tenant.package !== "pro") {
    return "Akun kasir hanya tersedia di paket Pro. Hubungi owner toko.";
  }
  return null;
}

/** Kasir + toko tempat dia bekerja. `blocked` berisi alasan kalau belum boleh dipakai. */
export async function getCashierContext() {
  const ctx = await requireContext(["cashier"]);
  const access = ctx.tenant ? getTenantAccess(ctx.tenant, ctx.hasPending) : null;
  return {
    profile: ctx.profile,
    tenant: ctx.tenant,
    access,
    blocked: blockReason("cashier", ctx.tenant, access),
  };
}

export type SaleContext =
  | { ok: true; profile: CurrentProfile; tenant: TenantRow }
  | { ok: false; reason: string };

/** Untuk aksi transaksi: owner atau kasir yang boleh berjualan. */
export async function getSaleContext(): Promise<SaleContext> {
  const ctx = await requireContext(["owner", "cashier"]);
  const access = ctx.tenant ? getTenantAccess(ctx.tenant, ctx.hasPending) : null;
  const reason = blockReason(ctx.profile.role, ctx.tenant, access);
  if (reason || !ctx.tenant) return { ok: false, reason: reason ?? "Toko tidak ditemukan." };
  return { ok: true, profile: ctx.profile, tenant: ctx.tenant };
}

/** Owner dengan langganan aktif. Akun terkunci diarahkan ke halaman Langganan. */
export async function requireActiveOwner() {
  const ctx = await getOwnerContext();
  if (!ctx.access.ok) redirect("/dashboard/langganan");
  return ctx;
}

/** Owner dengan paket Pro yang aktif. Paket Basic diarahkan ke halaman ajakan upgrade. */
export async function requireProOwner() {
  const ctx = await requireActiveOwner();
  if (ctx.tenant.package !== "pro") redirect("/dashboard/karyawan");
  return ctx;
}
