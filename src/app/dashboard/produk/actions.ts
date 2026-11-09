"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getOwnerContext } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { UUID_RE } from "@/lib/pos";
import { PRODUCT_IMAGE_BUCKET } from "@/lib/pos-data";

export type ProductState = { error: string } | null;

const IMAGE_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

async function removeImage(path: string | null | undefined) {
  if (!path) return;
  await supabaseAdmin.storage.from(PRODUCT_IMAGE_BUCKET).remove([path]);
}

/** Cari kategori (tanpa membedakan huruf besar/kecil), buat kalau belum ada. */
async function resolveCategoryId(
  supabase: SupabaseClient,
  tenantId: string,
  name: string,
): Promise<string | null> {
  const wanted = name.trim();
  if (!wanted) return null;

  const find = async () => {
    const { data } = await supabase.from("categories").select("id, name").eq("tenant_id", tenantId);
    return (data ?? []).find((c) => (c.name as string).toLowerCase() === wanted.toLowerCase());
  };

  const existing = await find();
  if (existing) return existing.id as string;

  const { data: created, error } = await supabase
    .from("categories")
    .insert({ tenant_id: tenantId, name: wanted })
    .select("id")
    .single();
  if (!error && created) return created.id as string;

  // Kemungkinan bentrok karena baru dibuat bersamaan: cari lagi.
  const retry = await find();
  return retry ? (retry.id as string) : null;
}

export async function saveProduct(
  _prev: ProductState,
  formData: FormData,
): Promise<ProductState> {
  const { tenant, access } = await getOwnerContext();
  if (!access.ok) return { error: "Langganan tidak aktif. Aktifkan dulu di menu Langganan." };

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const categoryName = String(formData.get("category") ?? "").trim();
  // Angka dikirim berformat ("5.000"); ambil digitnya saja.
  const priceDigits = String(formData.get("price") ?? "").replace(/\D/g, "");
  const price = Number(priceDigits);
  const trackStock = formData.get("trackStock") === "on";
  const stock = trackStock ? Number(String(formData.get("stock") ?? "").replace(/\D/g, "") || 0) : 0;

  const file = formData.get("image");
  const newImage = file instanceof File && file.size > 0 ? file : null;
  const wantRemove = formData.get("removeImage") === "1";

  if (name.length < 1 || name.length > 80) return { error: "Nama produk wajib diisi (maks. 80 karakter)." };
  if (categoryName.length > 40) return { error: "Nama kategori maksimal 40 karakter." };
  if (!priceDigits) return { error: "Harga wajib diisi." };
  if (!Number.isInteger(price) || price < 0 || price > 100_000_000) {
    return { error: "Harga harus berupa angka bulat 0 – 100.000.000." };
  }
  if (!Number.isInteger(stock) || stock < 0 || stock > 1_000_000) {
    return { error: "Stok harus berupa angka bulat 0 – 1.000.000." };
  }
  if (id && !UUID_RE.test(id)) return { error: "Produk tidak valid." };
  if (newImage) {
    if (!IMAGE_EXT[newImage.type]) return { error: "Foto harus berupa JPG, PNG, atau WebP." };
    if (newImage.size > MAX_IMAGE_BYTES) return { error: "Ukuran foto maksimal 2 MB." };
  }

  const supabase = await createClient();

  // Produk yang diedit: pastikan milik toko ini dan ambil foto lamanya.
  let oldPath: string | null = null;
  if (id) {
    const { data: existing } = await supabase
      .from("products")
      .select("image_path")
      .eq("id", id)
      .eq("tenant_id", tenant.id)
      .maybeSingle();
    if (!existing) return { error: "Produk tidak ditemukan." };
    oldPath = (existing.image_path as string | null) ?? null;
  }

  const categoryId = await resolveCategoryId(supabase, tenant.id, categoryName);
  if (categoryName && !categoryId) return { error: "Gagal menyimpan kategori. Coba lagi." };

  // Foto diunggah lewat server; path selalu di folder id tenant.
  let newPath: string | null = null;
  if (newImage) {
    newPath = `${tenant.id}/${crypto.randomUUID()}.${IMAGE_EXT[newImage.type]}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from(PRODUCT_IMAGE_BUCKET)
      .upload(newPath, newImage, { contentType: newImage.type, cacheControl: "31536000" });
    if (uploadError) return { error: "Gagal mengunggah foto. Coba lagi." };
  }

  const imagePath = newPath ?? (wantRemove ? null : oldPath);
  const values = {
    name,
    price,
    stock,
    track_stock: trackStock,
    category_id: categoryId,
    image_path: imagePath,
  };

  const { error } = id
    ? await supabase.from("products").update(values).eq("id", id).eq("tenant_id", tenant.id)
    : await supabase.from("products").insert({ ...values, tenant_id: tenant.id });

  if (error) {
    await removeImage(newPath); // batalkan foto baru supaya tidak jadi file yatim
    return { error: "Gagal menyimpan produk. Coba lagi." };
  }

  if (oldPath && oldPath !== imagePath) await removeImage(oldPath);

  revalidatePath("/dashboard/produk");
  revalidatePath("/dashboard/kasir");
  redirect("/dashboard/produk");
}

export async function deleteProduct(formData: FormData) {
  const { tenant, access } = await getOwnerContext();
  if (!access.ok) redirect("/dashboard/langganan");

  const id = String(formData.get("id") ?? "");
  if (UUID_RE.test(id)) {
    const supabase = await createClient();
    const { data: existing } = await supabase
      .from("products")
      .select("image_path")
      .eq("id", id)
      .eq("tenant_id", tenant.id)
      .maybeSingle();

    const { error } = await supabase.from("products").delete().eq("id", id).eq("tenant_id", tenant.id);
    if (!error) await removeImage(existing?.image_path as string | null | undefined);
  }
  revalidatePath("/dashboard/produk");
  revalidatePath("/dashboard/kasir");
  redirect("/dashboard/produk");
}
