"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type QrisState = { error?: string; success?: boolean } | null;

const MAX_BYTES = 5 * 1024 * 1024;
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function saveQris(_prev: QrisState, formData: FormData): Promise<QrisState> {
  await requireRole(["superadmin"]);

  const merchant = String(formData.get("merchantName") ?? "").trim();
  if (!merchant || merchant.length > 80) {
    return { error: "Nama merchant wajib diisi (maks. 80 karakter)." };
  }

  const { data: current } = await supabaseAdmin
    .from("app_settings")
    .select("value")
    .eq("key", "qris_path")
    .maybeSingle();
  const oldPath = (current?.value as string | undefined) ?? null;

  const file = formData.get("qris");
  const hasFile = file instanceof File && file.size > 0;
  if (!hasFile && !oldPath) return { error: "Unggah gambar QRIS terlebih dahulu." };

  const rows: { key: string; value: string; updated_at: string }[] = [
    { key: "qris_merchant_name", value: merchant, updated_at: new Date().toISOString() },
  ];

  let newPath: string | null = null;
  if (hasFile) {
    const ext = EXT[file.type];
    if (!ext) return { error: "QRIS harus berupa gambar JPG, PNG, atau WebP." };
    if (file.size > MAX_BYTES) return { error: "Ukuran gambar maksimal 5 MB." };

    newPath = `qris/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from("app-assets")
      .upload(newPath, file, { contentType: file.type });
    if (uploadError) return { error: "Gagal mengunggah QRIS. Coba lagi." };

    rows.push({ key: "qris_path", value: newPath, updated_at: new Date().toISOString() });
  }

  const { error } = await supabaseAdmin.from("app_settings").upsert(rows, { onConflict: "key" });
  if (error) {
    if (newPath) await supabaseAdmin.storage.from("app-assets").remove([newPath]);
    return { error: "Gagal menyimpan pengaturan." };
  }

  if (newPath && oldPath) await supabaseAdmin.storage.from("app-assets").remove([oldPath]);

  revalidatePath("/superadmin/settings");
  revalidatePath("/dashboard/langganan");
  return { success: true };
}
