import { requireActiveOwner } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";
import { fetchCategoryNames } from "@/lib/pos-data";
import ProductForm from "../product-form";

export default async function NewProductPage() {
  await requireActiveOwner();
  const categories = await fetchCategoryNames(await createClient());

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">Tambah Produk</h1>
      <div className="rounded-2xl bg-white p-6 shadow-[0_15px_50px_rgba(51,133,200,0.08)]">
        <ProductForm categories={categories} />
      </div>
    </div>
  );
}
