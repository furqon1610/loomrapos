import { getOwnerContext } from "@/lib/tenant";
import ReceiptPageContent from "@/components/receipt/ReceiptPageContent";

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { tenant, profile } = await getOwnerContext();

  return (
    <ReceiptPageContent
      id={id}
      tenant={tenant}
      viewer={{ id: profile.id, name: profile.fullName ?? profile.username }}
      newTxHref={tenant.package === "pro" ? "/dashboard/laporan" : "/dashboard/kasir"}
      newTxLabel={tenant.package === "pro" ? "Kembali ke laporan" : "Transaksi baru"}
    />
  );
}
