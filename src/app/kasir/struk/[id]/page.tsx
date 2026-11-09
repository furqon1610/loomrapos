import { getCashierContext } from "@/lib/tenant";
import ReceiptPageContent from "@/components/receipt/ReceiptPageContent";

export default async function CashierReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { profile, tenant, blocked } = await getCashierContext();
  if (blocked || !tenant) return null;

  return (
    <ReceiptPageContent
      id={id}
      tenant={tenant}
      viewer={{ id: profile.id, name: profile.fullName ?? profile.username }}
      newTxHref="/kasir"
    />
  );
}
