"use server";

import { revalidatePath } from "next/cache";
import { getSaleContext } from "@/lib/tenant";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { PAYMENT_METHODS, UUID_RE } from "@/lib/pos";

export type CheckoutInput = {
  items: { productId: string; qty: number }[];
  method: string;
  paid: number;
  discount: { type: "none" | "amount" | "percent"; value: number };
};
export type CheckoutResult = { id?: string; error?: string };

function friendlyError(message: string) {
  const stock = message.match(/insufficient_stock:(.+)/);
  if (stock) return `Stok "${stock[1].trim()}" tidak cukup.`;
  if (message.includes("paid_too_low")) return "Uang yang diterima kurang dari total.";
  if (message.includes("product_not_found")) return "Ada produk yang sudah tidak tersedia. Muat ulang halaman.";
  if (message.includes("tenant_locked")) return "Langganan tidak aktif.";
  if (message.includes("not_allowed")) return "Akun ini tidak diizinkan bertransaksi.";
  if (message.includes("total_too_large")) return "Total transaksi terlalu besar.";
  if (message.includes("empty_cart")) return "Keranjang masih kosong.";
  if (message.includes("invalid_discount")) return "Diskon tidak valid.";
  if (message.includes("shift_not_open")) return "Buka kasir dulu (isi modal awal) di menu Kas.";
  if (message.includes("not_clocked_in")) return "Clock-in dulu di menu Absensi.";
  return "Gagal menyimpan transaksi. Coba lagi.";
}

export async function checkout(input: CheckoutInput): Promise<CheckoutResult> {
  const ctx = await getSaleContext();
  if (!ctx.ok) return { error: ctx.reason };
  const { profile, tenant } = ctx;

  const methodOk = PAYMENT_METHODS.some((m) => m.id === input.method);
  const items = Array.isArray(input.items) ? input.items : [];
  const itemsOk =
    items.length >= 1 &&
    items.length <= 100 &&
    items.every(
      (i) =>
        typeof i.productId === "string" &&
        UUID_RE.test(i.productId) &&
        Number.isInteger(i.qty) &&
        i.qty >= 1 &&
        i.qty <= 9999,
    );
  const d = input.discount;
  const discountOk =
    !!d &&
    ((d.type === "none" && d.value === 0) ||
      (d.type === "amount" && Number.isInteger(d.value) && d.value > 0 && d.value <= 2_000_000_000) ||
      (d.type === "percent" && Number.isInteger(d.value) && d.value > 0 && d.value <= 100));
  if (!discountOk) return { error: "Diskon tidak valid." };

  if (!methodOk || !itemsOk || !Number.isInteger(input.paid) || input.paid < 0 || input.paid > 2_000_000_000) {
    return { error: "Data transaksi tidak valid." };
  }

  // Harga dan stok selalu dibaca ulang di database; yang dikirim browser hanya id dan jumlah.
  const { data, error } = await supabaseAdmin.rpc("create_transaction", {
    p_tenant: tenant.id,
    p_cashier: profile.id,
    p_items: items.map((i) => ({ product_id: i.productId, qty: i.qty })),
    p_method: input.method,
    p_paid: input.paid,
    p_discount_type: input.discount.type,
    p_discount_value: input.discount.value,
  });

  if (error || !data) return { error: friendlyError(error?.message ?? "") };

  revalidatePath("/dashboard/produk");
  revalidatePath("/dashboard/laporan");
  revalidatePath("/kasir/riwayat");
  revalidatePath("/dashboard");
  return { id: (data as { id: string }).id };
}
