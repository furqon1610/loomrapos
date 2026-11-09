export type ReceiptSettings = {
  paper_width: 58 | 80;
  show_logo: boolean;
  logo_size: number; // persen lebar kertas, 20–100
  show_store_name: boolean;
  show_address: boolean;
  show_phone: boolean;
  show_extra_info: boolean;
  show_cashier: boolean;
  show_number: boolean;
  show_datetime: boolean;
  show_payment_method: boolean;
  show_items: boolean;
  show_subtotal: boolean;
  show_discount: boolean;
  show_total: boolean;
  show_paid: boolean;
  show_change: boolean;
  footer: string;
};

export const RECEIPT_DEFAULTS: ReceiptSettings = {
  paper_width: 58,
  show_logo: true,
  logo_size: 50,
  show_store_name: true,
  show_address: true,
  show_phone: true,
  show_extra_info: true,
  show_cashier: true,
  show_number: true,
  show_datetime: true,
  show_payment_method: true,
  show_items: true,
  show_subtotal: true,
  show_discount: true,
  show_total: true,
  show_paid: true,
  show_change: true,
  footer: "Terima kasih",
};

/** Daftar centang "Isi struk" (logo diatur terpisah di bagian Logo). */
export const RECEIPT_TOGGLES: { key: keyof ReceiptSettings; label: string }[] = [
  { key: "show_store_name", label: "Nama toko" },
  { key: "show_address", label: "Alamat" },
  { key: "show_phone", label: "Nomor telepon" },
  { key: "show_extra_info", label: "Informasi tambahan" },
  { key: "show_cashier", label: "Nama kasir" },
  { key: "show_number", label: "Nomor transaksi" },
  { key: "show_datetime", label: "Tanggal & waktu" },
  { key: "show_payment_method", label: "Metode pembayaran" },
  { key: "show_items", label: "Detail produk" },
  { key: "show_subtotal", label: "Subtotal" },
  { key: "show_discount", label: "Diskon" },
  { key: "show_total", label: "Total" },
  { key: "show_paid", label: "Uang dibayar" },
  { key: "show_change", label: "Kembalian" },
];

/** Gabungkan baris dari database dengan default (baris belum ada atau kolom null). */
export function mergeReceiptSettings(row: Partial<Record<string, unknown>> | null): ReceiptSettings {
  const merged: Record<string, unknown> = { ...RECEIPT_DEFAULTS };
  if (row) {
    for (const key of Object.keys(RECEIPT_DEFAULTS)) {
      if (row[key] !== undefined && row[key] !== null) merged[key] = row[key];
    }
  }
  const s = merged as ReceiptSettings;
  s.paper_width = s.paper_width === 80 ? 80 : 58;
  return s;
}
