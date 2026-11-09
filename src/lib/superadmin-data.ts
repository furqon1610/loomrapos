import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getTenantAccess, type TenantRow } from "@/lib/billing";
import type { TenantListRow } from "@/components/superadmin/TenantTable";

/** Semua tenant beserta status akses dan nama owner-nya (terbaru di atas). */
export async function loadTenantRows(now: Date = new Date()): Promise<TenantListRow[]> {
  const [{ data: tenants }, { data: pending }, { data: owners }] = await Promise.all([
    supabaseAdmin.from("tenants").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("subscription_payments").select("tenant_id").eq("status", "pending"),
    supabaseAdmin.from("profiles").select("username, full_name, tenant_id").eq("role", "owner"),
  ]);

  const pendingIds = new Set((pending ?? []).map((p) => p.tenant_id as string));
  const ownerByTenant = new Map(
    (owners ?? []).map((o) => [o.tenant_id as string, (o.full_name ?? o.username) as string]),
  );

  return ((tenants ?? []) as TenantRow[]).map((tenant) => ({
    tenant,
    access: getTenantAccess(tenant, pendingIds.has(tenant.id), now),
    owner: ownerByTenant.get(tenant.id) ?? "-",
  }));
}
