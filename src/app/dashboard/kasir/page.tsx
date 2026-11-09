import { requireActiveOwner } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";
import { fetchAllProducts, fetchCategoryNames } from "@/lib/pos-data";
import { redirect } from "next/navigation";
import PosGate from "@/components/shift/PosGate";
import PosClient from "./pos-client";

export default async function KasirPage() {
  const { profile, tenant } = await requireActiveOwner();

  // Paket Pro: kasir dipakai lewat akun kasir, owner memantau dari Monitoring.
  if (tenant.package === "pro") redirect("/dashboard/karyawan/monitoring");
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
        shiftHref="/dashboard/kasir/shift"
        attendanceHref="/dashboard/kasir"
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
          receiptBase="/dashboard/kasir/struk"
          canManageProducts
        />
      </PosGate>
    </div>
  );
}
