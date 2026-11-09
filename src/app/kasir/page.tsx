import { getCashierContext } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";
import { fetchAllProducts, fetchCategoryNames } from "@/lib/pos-data";
import PosGate from "@/components/shift/PosGate";
import PosClient from "@/app/dashboard/kasir/pos-client";

export default async function CashierPosPage() {
  const { profile, tenant, blocked } = await getCashierContext();
  if (blocked || !tenant) return null; // layout menampilkan alasannya

  const supabase = await createClient();
  const [products, categories] = await Promise.all([
    fetchAllProducts(supabase),
    fetchCategoryNames(supabase),
  ]);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Kasir</h1>
      <PosGate
        profile={profile}
        tenantId={tenant.id}
        shiftHref="/kasir/shift"
        attendanceHref="/kasir/absensi"
      >
        <PosClient
          products={products.map((p) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            stock: p.stock,
            track_stock: p.track_stock,
            category: p.category,
            imageUrl: p.image_url,
          }))}
          categories={categories}
          receiptBase="/kasir/struk"
          canManageProducts={false}
        />
      </PosGate>
    </div>
  );
}
