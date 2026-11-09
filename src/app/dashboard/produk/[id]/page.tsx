import { notFound } from "next/navigation";
import { requireActiveOwner } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";
import { fetchCategoryNames, productImageUrl } from "@/lib/pos-data";
import { UUID_RE } from "@/lib/pos";
import ProductForm from "../product-form";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const { tenant } = await requireActiveOwner();
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select("id, name, price, stock, track_stock, image_path, categories(name)")
    .eq("id", id)
    .eq("tenant_id", tenant.id)
    .maybeSingle();
  if (!product) notFound();

  const categories = await fetchCategoryNames(supabase);
  const category = (product.categories as unknown as { name: string } | null)?.name ?? null;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">Edit Produk</h1>
      <div className="rounded-2xl bg-white p-6 shadow-[0_15px_50px_rgba(51,133,200,0.08)]">
        <ProductForm
          categories={categories}
          initial={{
            id: product.id as string,
            name: product.name as string,
            price: product.price as number,
            stock: product.stock as number,
            track_stock: product.track_stock as boolean,
            category,
            imageUrl: productImageUrl(supabase, (product.image_path as string | null) ?? null),
          }}
        />
      </div>
    </div>
  );
}
