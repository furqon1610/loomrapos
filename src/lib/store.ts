import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { mergeReceiptSettings, type ReceiptSettings } from "@/lib/receipt";

export const TENANT_LOGO_BUCKET = "tenant-logos";

/** URL publik logo toko (bucket publik), atau null kalau belum ada logo. */
export function tenantLogoUrl(supabase: SupabaseClient, path: string | null): string | null {
  if (!path) return null;
  return supabase.storage.from(TENANT_LOGO_BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Pengaturan struk toko; memakai default kalau belum pernah disimpan. */
export async function getReceiptSettings(
  supabase: SupabaseClient,
  tenantId: string,
): Promise<ReceiptSettings> {
  const { data } = await supabase
    .from("receipt_settings")
    .select("*")
    .eq("tenant_id", tenantId)
    .maybeSingle();
  return mergeReceiptSettings(data as Record<string, unknown> | null);
}

export type TenantSettings = { require_open_shift: boolean; require_clock_in: boolean };

/** Pengaturan operasional toko; default semuanya mati kalau belum pernah disimpan. */
export async function getTenantSettings(
  supabase: SupabaseClient,
  tenantId: string,
): Promise<TenantSettings> {
  const { data } = await supabase
    .from("tenant_settings")
    .select("require_open_shift, require_clock_in")
    .eq("tenant_id", tenantId)
    .maybeSingle();
  return {
    require_open_shift: data?.require_open_shift === true,
    require_clock_in: data?.require_clock_in === true,
  };
}
