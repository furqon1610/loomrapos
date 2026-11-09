import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ProductRow = {
  id: string;
  name: string;
  price: number;
  stock: number;
  track_stock: boolean;
  category_id: string | null;
  category: string | null;
  image_path: string | null;
  image_url: string | null;
};

export const PRODUCT_IMAGE_BUCKET = "product-images";

/** URL publik foto produk (bucket publik), atau null kalau produk belum punya foto. */
export function productImageUrl(supabase: SupabaseClient, path: string | null): string | null {
  if (!path) return null;
  return supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Ambil semua produk (PostgREST membatasi 1000 baris per permintaan, jadi dipaginasi). */
export async function fetchAllProducts(supabase: SupabaseClient): Promise<ProductRow[]> {
  const size = 1000;
  const rows: ProductRow[] = [];

  for (let from = 0; from < 20000; from += size) {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, price, stock, track_stock, category_id, image_path, categories(name)")
      .order("name")
      .range(from, from + size - 1);
    if (error || !data) break;

    for (const p of data as unknown as (Omit<ProductRow, "category" | "image_url"> & {
      categories: { name: string } | null;
    })[]) {
      rows.push({
        id: p.id,
        name: p.name,
        price: p.price,
        stock: p.stock,
        track_stock: p.track_stock,
        category_id: p.category_id,
        category: p.categories?.name ?? null,
        image_path: p.image_path,
        image_url: productImageUrl(supabase, p.image_path),
      });
    }
    if (data.length < size) break;
  }
  return rows;
}

export async function fetchCategoryNames(supabase: SupabaseClient): Promise<string[]> {
  const { data } = await supabase.from("categories").select("name").order("name");
  return (data ?? []).map((c) => c.name as string);
}
