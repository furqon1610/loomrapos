import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getReceiptSettings, tenantLogoUrl } from "@/lib/store";
import { PAYMENT_LABEL, UUID_RE } from "@/lib/pos";
import type { TenantRow } from "@/lib/billing";
import type { ReceiptData, ReceiptStore } from "@/lib/receipt-layout";
import PrintButton from "@/components/owner/PrintButton";
import PrintBluetoothButton from "@/components/receipt/PrintBluetoothButton";
import ReceiptView from "@/components/receipt/ReceiptView";

type Item = { id: string; product_name: string; unit_price: number; qty: number; subtotal: number };

/** Isi halaman struk, dipakai oleh owner dan kasir (akses data tetap dijaga RLS). */
export default async function ReceiptPageContent({
  id,
  tenant,
  viewer,
  newTxHref,
  newTxLabel = "Transaksi baru",
}: {
  id: string;
  tenant: TenantRow;
  viewer: { id: string; name: string };
  newTxHref: string;
  newTxLabel?: string;
}) {
  if (!UUID_RE.test(id)) notFound();
  const supabase = await createClient();

  const { data: tx } = await supabase
    .from("transactions")
    .select("id, number, subtotal, discount, total, payment_method, amount_paid, change_amount, created_at, cashier_id")
    .eq("id", id)
    .eq("tenant_id", tenant.id)
    .maybeSingle();
  if (!tx) notFound();

  const [{ data: itemData }, settings] = await Promise.all([
    supabase
      .from("transaction_items")
      .select("id, product_name, unit_price, qty, subtotal")
      .eq("transaction_id", id)
      .order("product_name"),
    getReceiptSettings(supabase, tenant.id),
  ]);
  const items = (itemData ?? []) as Item[];

  // Nama kasir: dirinya sendiri, atau (khusus owner) kasir lain di tokonya.
  let cashierName: string | null = null;
  if (tx.cashier_id === viewer.id) {
    cashierName = viewer.name;
  } else if (tx.cashier_id) {
    const { data: cashier } = await supabase
      .from("profiles")
      .select("full_name, username")
      .eq("id", tx.cashier_id)
      .maybeSingle();
    cashierName = (cashier?.full_name ?? cashier?.username ?? null) as string | null;
  }

  const store: ReceiptStore = {
    name: tenant.name,
    address: tenant.address,
    phone: tenant.phone,
    extraInfo: tenant.extra_info,
    logoUrl: tenantLogoUrl(supabase, tenant.logo_path),
  };

  const data: ReceiptData = {
    number: tx.number,
    createdAt: tx.created_at,
    cashierName,
    paymentLabel: PAYMENT_LABEL[tx.payment_method] ?? tx.payment_method,
    isCash: tx.payment_method === "cash",
    items: items.map((i) => ({
      name: i.product_name,
      qty: i.qty,
      unitPrice: i.unit_price,
      subtotal: i.subtotal,
    })),
    subtotal: tx.subtotal,
    discount: tx.discount,
    total: tx.total,
    paid: tx.amount_paid,
    change: tx.change_amount,
  };

  return (
    <div className="space-y-5">
      <ReceiptView store={store} settings={settings} data={data} />

      <div className="flex flex-col items-center gap-3 print:hidden">
        <PrintBluetoothButton store={store} settings={settings} data={data} autoPrintKey={tx.id} />
        <div className="flex flex-wrap items-center justify-center gap-3">
          <PrintButton />
          <Link
            href={newTxHref}
            className="rounded-xl border border-[#d6e2ef] bg-white px-5 py-3 text-sm font-semibold text-[#4a5f7d] transition hover:bg-[#f7fbff]"
          >
            {newTxLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
