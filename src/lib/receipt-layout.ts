import { formatRupiah } from "@/lib/billing";
import { formatDateTimeWib } from "@/lib/format";
import type { ReceiptSettings } from "@/lib/receipt";

export type ReceiptStore = {
  name: string;
  address: string | null;
  phone: string | null;
  extraInfo: string | null;
  logoUrl: string | null;
};

export type ReceiptData = {
  number: string;
  createdAt: string;
  cashierName: string | null;
  paymentLabel: string;
  isCash: boolean;
  items: { name: string; qty: number; unitPrice: number; subtotal: number }[];
  subtotal: number;
  discount: number;
  total: number;
  paid: number;
  change: number;
};

export type Block =
  | { kind: "logo"; url: string; sizePct: number }
  | { kind: "title"; text: string }
  | { kind: "center"; text: string; small?: boolean }
  | { kind: "text"; text: string; gapBefore?: boolean }
  | { kind: "row"; left: string; right: string; bold?: boolean };

/** Satu bagian struk; antar bagian diberi garis pemisah. */
export type Section = Block[];

/**
 * Susunan struk dalam bentuk data. Dipakai sama persis oleh tampilan layar
 * (ReceiptView) dan oleh pencetak Bluetooth (ESC/POS), jadi hasilnya selalu sama.
 */
export function buildReceiptModel(
  store: ReceiptStore,
  s: ReceiptSettings,
  data: ReceiptData,
): Section[] {
  const sections: Section[] = [];
  const push = (blocks: Section) => {
    if (blocks.length > 0) sections.push(blocks);
  };

  // --- Kepala: logo, nama, alamat, telepon, info tambahan ---
  const head: Section = [];
  if (s.show_logo && store.logoUrl) head.push({ kind: "logo", url: store.logoUrl, sizePct: s.logo_size });
  if (s.show_store_name && store.name) head.push({ kind: "title", text: store.name });
  if (s.show_address && store.address) head.push({ kind: "center", text: store.address });
  if (s.show_phone && store.phone) head.push({ kind: "center", text: store.phone });
  const extra = store.extraInfo?.trim();
  if (s.show_extra_info && extra) head.push({ kind: "center", text: extra });
  push(head);

  // --- Info transaksi ---
  const info: Section = [];
  if (s.show_number) info.push({ kind: "row", left: "No", right: data.number });
  if (s.show_datetime) info.push({ kind: "row", left: "Waktu", right: formatDateTimeWib(data.createdAt) });
  if (s.show_cashier && data.cashierName) info.push({ kind: "row", left: "Kasir", right: data.cashierName });
  push(info);

  // --- Detail produk ---
  if (s.show_items) {
    const items: Section = [];
    data.items.forEach((i, idx) => {
      items.push({ kind: "text", text: i.name, gapBefore: idx > 0 });
      items.push({
        kind: "row",
        left: `${i.qty} x ${formatRupiah(i.unitPrice)}`,
        right: formatRupiah(i.subtotal),
      });
    });
    push(items);
  }

  // --- Total & pembayaran ---
  const totals: Section = [];
  if (s.show_subtotal) totals.push({ kind: "row", left: "Subtotal", right: formatRupiah(data.subtotal) });
  if (s.show_discount && data.discount > 0) {
    totals.push({ kind: "row", left: "Diskon", right: `-${formatRupiah(data.discount)}` });
  }
  if (s.show_total) totals.push({ kind: "row", left: "TOTAL", right: formatRupiah(data.total), bold: true });
  if (s.show_payment_method) totals.push({ kind: "row", left: "Pembayaran", right: data.paymentLabel });
  if (s.show_paid) totals.push({ kind: "row", left: "Dibayar", right: formatRupiah(data.paid) });
  if (s.show_change && data.isCash) {
    totals.push({ kind: "row", left: "Kembali", right: formatRupiah(data.change) });
  }
  push(totals);

  // --- Footer bebas ---
  const footer = s.footer.trim();
  if (footer) push([{ kind: "center", text: footer }]);

  // --- Penanda platform, selalu paling bawah (hanya kalau struk punya isi) ---
  if (sections.length > 0) push([{ kind: "center", text: "Powered by LoomraPOS", small: true }]);

  return sections;
}
