"use server";

import { revalidatePath } from "next/cache";
import { requireActiveOwner } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { TENANT_LOGO_BUCKET } from "@/lib/store";
import { RECEIPT_TOGGLES } from "@/lib/receipt";

export type ReceiptSettingsState = { error?: string; savedAt?: number } | null;

const IMAGE_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const PHONE_RE = /^[0-9+\-\s]{8,20}$/;

async function removeLogoFile(path: string | null | undefined) {
  if (!path) return;
  await supabaseAdmin.storage.from(TENANT_LOGO_BUCKET).remove([path]);
}

export async function saveReceiptSettings(
  _prev: ReceiptSettingsState,
  formData: FormData,
): Promise<ReceiptSettingsState> {
  const { tenant } = await requireActiveOwner();

  // --- Informasi toko ---
  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const extraInfo = String(formData.get("extra_info") ?? "").trim();

  // --- Struk ---
  const footer = String(formData.get("footer") ?? "").trim();
  const paperWidth = Number(formData.get("paper_width"));
  const logoSize = Number(formData.get("logo_size"));

  // --- Logo ---
  const file = formData.get("image");
  const newLogo = file instanceof File && file.size > 0 ? file : null;
  const wantRemove = formData.get("removeImage") === "1";

  if (name.length < 2 || name.length > 80) return { error: "Nama toko wajib diisi (2–80 karakter)." };
  if (address.length > 200) return { error: "Alamat maksimal 200 karakter." };
  if (phone && !PHONE_RE.test(phone)) return { error: "Nomor telepon tidak valid." };
  if (extraInfo.length > 200) return { error: "Informasi tambahan maksimal 200 karakter." };
  if (footer.length > 300) return { error: "Footer maksimal 300 karakter." };
  if (paperWidth !== 58 && paperWidth !== 80) return { error: "Lebar kertas tidak valid." };
  if (!Number.isInteger(logoSize) || logoSize < 20 || logoSize > 100) {
    return { error: "Ukuran logo harus 20–100." };
  }
  if (newLogo) {
    if (!IMAGE_EXT[newLogo.type]) return { error: "Logo harus berupa JPG, PNG, atau WebP." };
    if (newLogo.size > MAX_IMAGE_BYTES) return { error: "Ukuran logo maksimal 2 MB." };
  }

  // Logo diunggah lewat server; path selalu di folder id tenant.
  const oldPath = tenant.logo_path;
  let newPath: string | null = null;
  if (newLogo) {
    newPath = `${tenant.id}/${crypto.randomUUID()}.${IMAGE_EXT[newLogo.type]}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from(TENANT_LOGO_BUCKET)
      .upload(newPath, newLogo, { contentType: newLogo.type, cacheControl: "31536000" });
    if (uploadError) return { error: "Gagal mengunggah logo. Coba lagi." };
  }
  const logoPath = newPath ?? (wantRemove ? null : oldPath);

  const supabase = await createClient();

  const { error: tenantError } = await supabase
    .from("tenants")
    .update({
      name,
      address: address || null,
      phone: phone || null,
      extra_info: extraInfo || null,
      logo_path: logoPath,
    })
    .eq("id", tenant.id);

  if (tenantError) {
    await removeLogoFile(newPath);
    return { error: "Gagal menyimpan informasi toko. Coba lagi." };
  }

  const toggles = Object.fromEntries(
    RECEIPT_TOGGLES.map((t) => [t.key, formData.get(t.key) === "on"]),
  );
  const { error: settingsError } = await supabase.from("receipt_settings").upsert(
    {
      tenant_id: tenant.id,
      paper_width: paperWidth,
      show_logo: formData.get("show_logo") === "on",
      logo_size: logoSize,
      ...toggles,
      footer,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "tenant_id" },
  );

  if (settingsError) {
    return { error: "Informasi toko tersimpan, tetapi pengaturan struk gagal disimpan. Coba lagi." };
  }

  if (oldPath && oldPath !== logoPath) await removeLogoFile(oldPath);

  revalidatePath("/dashboard", "layout");
  return { savedAt: Date.now() };
}
