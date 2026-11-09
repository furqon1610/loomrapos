"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Icon } from "@/components/icons";
import { formatRupiah } from "@/lib/billing";
import { formatThousands, onlyDigits } from "@/lib/number-format";
import { PAYMENT_METHODS, type PaymentMethod } from "@/lib/pos";
import { checkout } from "./actions";

export type PosProduct = {
  id: string;
  name: string;
  price: number;
  stock: number;
  track_stock: boolean;
  category: string | null;
  imageUrl: string | null;
};

const card = "rounded-2xl bg-white shadow-[0_15px_50px_rgba(51,133,200,0.08)]";

export default function PosClient({
  products,
  categories,
  receiptBase,
  canManageProducts,
}: {
  products: PosProduct[];
  categories: string[];
  /** Awal alamat halaman struk, mis. "/dashboard/kasir/struk". */
  receiptBase: string;
  /** Hanya owner yang boleh menambah produk. */
  canManageProducts: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [paid, setPaid] = useState("");
  const [discountType, setDiscountType] = useState<"amount" | "percent">("amount");
  const [discountInput, setDiscountInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const byId = new Map(products.map((p) => [p.id, p]));
  const q = query.trim().toLowerCase();
  const filtered = products.filter(
    (p) => (!cat || p.category === cat) && (!q || p.name.toLowerCase().includes(q)),
  );

  const lines = Object.entries(cart)
    .map(([id, qty]) => ({ product: byId.get(id), qty }))
    .filter((l): l is { product: PosProduct; qty: number } => !!l.product);
  const subtotal = lines.reduce((sum, l) => sum + l.product.price * l.qty, 0);

  // Diskon: rumus yang sama dengan database (pembulatan ke atas dari .5).
  const discountValue = Number(discountInput) || 0;
  const discount =
    discountType === "percent"
      ? Math.floor((subtotal * Math.min(discountValue, 100) + 50) / 100)
      : Math.min(discountValue, subtotal);
  const total = subtotal - discount;
  const itemCount = lines.reduce((sum, l) => sum + l.qty, 0);

  const paidNum = Number(paid.replace(/\D/g, "")) || 0;
  const change = paidNum - total;
  const canPay = lines.length > 0 && !pending && (method !== "cash" || paidNum >= total);

  const quick = [
    ...new Set([total, ...[10000, 50000, 100000].map((n) => Math.ceil(total / n) * n)]),
  ]
    .filter((n) => n >= total && n > 0)
    .slice(0, 4);

  function add(id: string) {
    const p = byId.get(id);
    if (!p) return;
    const current = cart[id] ?? 0;
    if (p.track_stock && current >= p.stock) return;
    setCart({ ...cart, [id]: current + 1 });
  }

  function change_(id: string, delta: number) {
    const p = byId.get(id);
    if (!p) return;
    const next = (cart[id] ?? 0) + delta;
    if (next <= 0) {
      const { [id]: _removed, ...rest } = cart;
      void _removed;
      setCart(rest);
      return;
    }
    if (p.track_stock && next > p.stock) return;
    setCart({ ...cart, [id]: next });
  }

  function pay() {
    setError(null);
    startTransition(async () => {
      const res = await checkout({
        items: lines.map((l) => ({ productId: l.product.id, qty: l.qty })),
        method,
        paid: method === "cash" ? paidNum : total,
        discount:
          discount > 0
            ? { type: discountType, value: discountType === "percent" ? Math.min(discountValue, 100) : discount }
            : { type: "none", value: 0 },
      });
      if (res.error || !res.id) {
        setError(res.error ?? "Gagal menyimpan transaksi.");
        return;
      }
      router.push(`${receiptBase}/${res.id}`);
    });
  }

  if (products.length === 0) {
    return (
      <div className={`${card} flex flex-col items-center gap-3 px-6 py-16 text-center`}>
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8f3fc] text-[#3385c8]">
          <Icon name="box" className="h-7 w-7" />
        </span>
        <p className="font-semibold">Belum ada produk</p>
        <p className="max-w-xs text-sm text-[#7183a0]">
          {canManageProducts
            ? "Tambahkan produk dulu supaya bisa dipilih di kasir."
            : "Minta owner menambahkan produk dulu supaya bisa dipilih di kasir."}
        </p>
        {canManageProducts && (
          <Link
            href="/dashboard/produk/baru"
            className="mt-2 rounded-xl bg-[#3385c8] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2875b4]"
          >
            Tambah Produk
          </Link>
        )}
      </div>
    );
  }

  const chip = (active: boolean) =>
    `shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${
      active ? "bg-[#3385c8] text-white" : "bg-white text-[#4a5f7d] hover:bg-[#e8f3fc]"
    }`;

  return (
    <div className="pb-20 lg:pb-0">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        {/* Daftar produk */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl border border-[#d6e2ef] bg-white px-4">
            <Icon name="search" className="h-5 w-5 text-[#7890ae]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari produk"
              className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-[#9aabc0]"
            />
          </div>

          {categories.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button type="button" onClick={() => setCat(null)} className={chip(cat === null)}>
                Semua
              </button>
              {categories.map((c) => (
                <button key={c} type="button" onClick={() => setCat(c)} className={chip(cat === c)}>
                  {c}
                </button>
              ))}
            </div>
          )}

          {filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-[#7183a0]">Produk tidak ditemukan.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {filtered.map((p) => {
                const soldOut = p.track_stock && p.stock === 0;
                const inCart = cart[p.id] ?? 0;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => add(p.id)}
                    disabled={soldOut}
                    className={`${card} relative overflow-hidden text-left transition enabled:hover:-translate-y-0.5 enabled:active:scale-[0.98] disabled:opacity-60`}
                  >
                    <div className="relative aspect-square w-full bg-[#eef5fc]">
                      {p.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.imageUrl}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[#9fc3e6]">
                          <Icon name="box" className="h-10 w-10" />
                        </div>
                      )}
                      {inCart > 0 && (
                        <span className="absolute left-2 top-2 flex h-7 min-w-7 items-center justify-center rounded-full bg-[#102a4c] px-2 text-xs font-bold text-white shadow">
                          {inCart}
                        </span>
                      )}
                      {soldOut && (
                        <span className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm font-bold text-red-600">
                          Habis
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="line-clamp-2 min-h-10 text-sm font-semibold leading-5">{p.name}</p>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-[#2875b4]">
                            {formatRupiah(p.price)}
                          </p>
                          <p className="text-[11px] text-[#7183a0]">
                            {p.track_stock ? `Stok ${p.stock}` : "Tanpa stok"}
                          </p>
                        </div>
                        <span
                          aria-hidden="true"
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#3385c8] text-white shadow-md shadow-[#3385c8]/30"
                        >
                          <Icon name="plus" className="h-5 w-5" />
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Keranjang & pembayaran */}
        <aside id="cart" className={`${card} p-5 lg:sticky lg:top-6`}>
          <h2 className="text-lg font-bold">Keranjang</h2>

          {lines.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#7183a0]">Pilih produk untuk memulai.</p>
          ) : (
            <ul className="mt-3 divide-y divide-[#eef2f7]">
              {lines.map(({ product: p, qty }) => (
                <li key={p.id} className="py-3">
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#eef5fc] text-[#9fc3e6]">
                      {p.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Icon name="box" className="h-5 w-5" />
                      )}
                    </span>
                    <p className="min-w-0 flex-1 text-sm font-semibold">{p.name}</p>
                    <p className="shrink-0 text-sm font-bold">{formatRupiah(p.price * qty)}</p>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-[#7183a0]">{formatRupiah(p.price)}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => change_(p.id, -1)}
                        aria-label={`Kurangi ${p.name}`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f0f6fc] text-[#2875b4] transition hover:bg-[#e0eefa]"
                      >
                        <Icon name="minus" className="h-4 w-4" />
                      </button>
                      <span className="w-6 text-center text-sm font-semibold">{qty}</span>
                      <button
                        type="button"
                        onClick={() => change_(p.id, 1)}
                        aria-label={`Tambah ${p.name}`}
                        disabled={p.track_stock && qty >= p.stock}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f0f6fc] text-[#2875b4] transition hover:bg-[#e0eefa] disabled:opacity-40"
                      >
                        <Icon name="plus" className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-2 space-y-3 border-t border-[#eef2f7] pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#7183a0]">Subtotal ({itemCount} item)</span>
              <span className="font-semibold">{formatRupiah(subtotal)}</span>
            </div>

            <div>
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="discount" className="text-sm text-[#7183a0]">
                  Diskon
                </label>
                <div className="flex gap-1 rounded-lg bg-[#f0f6fc] p-0.5">
                  {(["amount", "percent"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setDiscountType(t);
                        setDiscountInput("");
                      }}
                      className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                        discountType === t ? "bg-white text-[#2875b4] shadow-sm" : "text-[#7183a0]"
                      }`}
                    >
                      {t === "amount" ? "Rp" : "%"}
                    </button>
                  ))}
                </div>
              </div>
              <input
                id="discount"
                inputMode="numeric"
                value={discountType === "percent" ? discountInput : formatThousands(discountInput)}
                onChange={(e) => setDiscountInput(onlyDigits(e.target.value, discountType === "percent" ? 3 : 10))}
                placeholder={discountType === "percent" ? "0 (maks. 100)" : "0"}
                className="mt-2 w-full rounded-xl border border-[#d6e2ef] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#3385c8] focus:ring-4 focus:ring-[#3385c8]/10"
              />
              {discountType === "percent" && discountValue > 100 && (
                <p className="mt-1 text-xs text-red-600">Maksimal 100%.</p>
              )}
              {discountType === "amount" && discountValue > subtotal && subtotal > 0 && (
                <p className="mt-1 text-xs text-[#7183a0]">Diskon dibatasi sebesar subtotal.</p>
              )}
            </div>

            {discount > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#7183a0]">Potongan</span>
                <span className="font-semibold text-emerald-600">-{formatRupiah(discount)}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm text-[#7183a0]">Total</span>
              <span className="text-2xl font-bold">{formatRupiah(total)}</span>
            </div>
          </div>

          <p className="mb-2 mt-5 text-sm font-semibold">Metode pembayaran</p>
          <div className="grid grid-cols-4 gap-2">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMethod(m.id)}
                className={`rounded-xl px-2 py-2.5 text-xs font-semibold transition ${
                  method === m.id
                    ? "bg-[#3385c8] text-white"
                    : "bg-[#f0f6fc] text-[#4a5f7d] hover:bg-[#e0eefa]"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {method === "cash" && (
            <div className="mt-4 space-y-3">
              <div>
                <label htmlFor="paid" className="mb-1.5 block text-sm font-semibold">
                  Uang diterima
                </label>
                <input
                  id="paid"
                  inputMode="numeric"
                  value={formatThousands(paid)}
                  onChange={(e) => setPaid(onlyDigits(e.target.value, 10))}
                  placeholder="0"
                  className="w-full rounded-xl border border-[#d6e2ef] bg-white px-4 py-3 text-sm outline-none focus:border-[#3385c8] focus:ring-4 focus:ring-[#3385c8]/10"
                />
              </div>
              {quick.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {quick.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setPaid(String(n))}
                      className="rounded-lg bg-[#f0f6fc] px-3 py-1.5 text-xs font-semibold text-[#2875b4] transition hover:bg-[#e0eefa]"
                    >
                      {n === total ? "Uang pas" : formatRupiah(n)}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#7183a0]">Kembalian</span>
                <span className={`font-bold ${change < 0 ? "text-red-600" : ""}`}>
                  {paidNum === 0 ? "-" : change < 0 ? `Kurang ${formatRupiah(-change)}` : formatRupiah(change)}
                </span>
              </div>
            </div>
          )}

          {error && (
            <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={pay}
            disabled={!canPay}
            className="mt-5 flex w-full items-center justify-center rounded-xl bg-[#3385c8] py-4 font-semibold text-white shadow-lg shadow-[#3385c8]/20 transition hover:bg-[#2875b4] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "Memproses..." : "Bayar"}
          </button>
        </aside>
      </div>

      {/* Bar total (HP) */}
      <a
        href="#cart"
        className="fixed inset-x-3 bottom-3 z-10 flex items-center justify-between rounded-2xl bg-[#102a4c] px-5 py-4 text-white shadow-xl lg:hidden"
      >
        <span className="text-sm">{itemCount} item</span>
        <span className="font-bold">{formatRupiah(total)} · Lihat keranjang</span>
      </a>
    </div>
  );
}
