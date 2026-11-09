"use server";

import { revalidatePath } from "next/cache";
import { requireActiveOwner } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";

export type OperationalState = { error?: string; savedAt?: number } | null;

export async function saveOperationalSettings(
  _prev: OperationalState,
  formData: FormData,
): Promise<OperationalState> {
  const { tenant } = await requireActiveOwner();

  const supabase = await createClient();
  const { error } = await supabase.from("tenant_settings").upsert(
    {
      tenant_id: tenant.id,
      require_open_shift: formData.get("require_open_shift") === "on",
      // Wajib clock-in hanya berarti untuk kasir, yaitu fitur paket Pro.
      require_clock_in: tenant.package === "pro" && formData.get("require_clock_in") === "on",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "tenant_id" },
  );
  if (error) return { error: "Gagal menyimpan pengaturan. Coba lagi." };

  revalidatePath("/dashboard", "layout");
  revalidatePath("/kasir", "layout");
  return { savedAt: Date.now() };
}
