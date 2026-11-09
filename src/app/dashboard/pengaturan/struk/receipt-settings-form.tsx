"use client";

import Link from "next/link";
import { startTransition, useActionState, useState, type FormEvent } from "react";
import ImagePicker from "@/components/owner/ImagePicker";
import ReceiptView, { type ReceiptData } from "@/components/receipt/ReceiptView";
import { RECEIPT_TOGGLES, type ReceiptSettings } from "@/lib/receipt";
import { saveReceiptSettings, type ReceiptSettingsState } from "./actions";

const card = "rounded-2xl bg-white p-5 shadow-[0_15px_50px_rgba(51,133,200,0.08)] sm:p-6";
const input =
  "w-full rounded-xl border border-[#d6e2ef] bg-white px-4 py-3 text-sm text-[#102a4c] outline-none transition placeholder:text-[#9aabc0] focus:border-[#3385c8] focus:ring-4 focus:ring-[#3385c8]/10 disabled:opacity-60";

export type StoreInitial = {
  name: string;
  address: string;
  phone: string;
  extraInfo: string;
};

export default function ReceiptSettingsForm({
  store: initialStore,
  logoUrl: initialLogoUrl,
  settings: initialSettings,
  cashierName,
  sampleDate,
}: {
  store: StoreInitial;
  logoUrl: string | null;
  settings: ReceiptSettings;
  cashierName: string;
  sampleDate: string;
}) {
  const [state, formAction, pending] = useActionState<ReceiptSettingsState, FormData>(
    saveReceiptSettings,
    null,
  );
  const [store, setStore] = useState(initialStore);
  const [logoUrl, setLogoUrl] = useState<string | null>(initialLogoUrl);
  const [s, setS] = useState<ReceiptSettings>(initialSettings);

  function set<K extends keyof ReceiptSettings>(key: K, value: ReceiptSettings[K]) {
    setS((prev) => ({ ...prev, [key]: value }));
  }

  // Dikirim lewat onSubmit (bukan prop action) supaya isian tidak ter-reset kalau ada error.
  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => formAction(data));
  }

  const sample: ReceiptData = {
    number: "TRX00001",
    createdAt: sampleDate,
    cashierName,
    paymentLabel: "Tunai",
    isCash: true,
    items: [
      { name: "Kopi Susu", qty: 2, unitPrice: 18000, subtotal: 36000 },
      { name: "Roti Bakar", qty: 1, unitPrice: 15000, subtotal: 15000 },
    ],
    subtotal: 51000,
    discount: 5000,
    total: 46000,
    paid: 50000,
    change: 4000,
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
      <form onSubmit={onSubmit} className="space-y-5">
        {/* 1. Logo */}
        <section className={card}>
          <h2 className="mb-4 text-lg font-bold">1. Logo</h2>
          <ImagePicker
            key={state?.savedAt ?? 0}
            currentUrl={logoUrl}
            pending={pending}
            label="Logo toko"
            shape="fit"
            onChange={setLogoUrl}
          />

          <label className="mt-5 flex cursor-pointer items-center gap-3 text-sm font-semibold">
            <input
              type="checkbox"
              name="show_logo"
              checked={s.show_logo}
              onChange={(e) => set("show_logo", e.target.checked)}
              disabled={pending}
              className="h-4 w-4 accent-[#3385c8]"
            />
            Tampilkan logo di struk
          </label>

          <div className="mt-4">
            <label htmlFor="logo_size" className="mb-2 flex items-center justify-between text-sm font-semibold">
              <span>Ukuran logo</span>
              <span className="text-[#7183a0]">{s.logo_size}% lebar struk</span>
            </label>
            <input
              id="logo_size"
              name="logo_size"
              type="range"
              min={20}
              max={100}
              step={5}
              value={s.logo_size}
              onChange={(e) => set("logo_size", Number(e.target.value))}
              disabled={pending || !s.show_logo}
              className="w-full accent-[#3385c8] disabled:opacity-50"
            />
          </div>
        </section>

        {/* 2. Informasi toko */}
        <section className={card}>
          <h2 className="mb-4 text-lg font-bold">2. Informasi toko</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-semibold">
                Nama toko
              </label>
              <input
                id="name"
                name="name"
                required
                maxLength={80}
                value={store.name}
                onChange={(e) => setStore({ ...store, name: e.target.value })}
                disabled={pending}
                className={input}
              />
            </div>
            <div>
              <label htmlFor="address" className="mb-2 block text-sm font-semibold">
                Alamat
              </label>
              <textarea
                id="address"
                name="address"
                rows={2}
                maxLength={200}
                value={store.address}
                onChange={(e) => setStore({ ...store, address: e.target.value })}
                disabled={pending}
                placeholder="Alamat toko"
                className={input}
              />
            </div>
            <div>
              <label htmlFor="phone" className="mb-2 block text-sm font-semibold">
                Nomor telepon
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={store.phone}
                onChange={(e) => setStore({ ...store, phone: e.target.value })}
                disabled={pending}
                placeholder="08xxxxxxxxxx"
                className={input}
              />
            </div>
            <div>
              <label htmlFor="extra_info" className="mb-2 block text-sm font-semibold">
                Informasi tambahan
              </label>
              <textarea
                id="extra_info"
                name="extra_info"
                rows={3}
                maxLength={200}
                value={store.extraInfo}
                onChange={(e) => setStore({ ...store, extraInfo: e.target.value })}
                disabled={pending}
                placeholder="Contoh: IG @warkopagus · WiFi: warkopagus123"
                className={input}
              />
              <p className="mt-1 text-right text-xs text-[#7183a0]">{store.extraInfo.length}/200</p>
            </div>
          </div>
        </section>

        {/* 3. Isi struk */}
        <section className={card}>
          <h2 className="mb-1 text-lg font-bold">3. Isi struk</h2>
          <p className="mb-4 text-sm text-[#7183a0]">Centang yang ingin ditampilkan.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {RECEIPT_TOGGLES.map((t) => (
              <label key={t.key} className="flex cursor-pointer items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  name={t.key}
                  checked={s[t.key] as boolean}
                  onChange={(e) => set(t.key, e.target.checked as never)}
                  disabled={pending}
                  className="h-4 w-4 accent-[#3385c8]"
                />
                {t.label}
              </label>
            ))}
          </div>
          <p className="mt-4 text-xs text-[#7183a0]">
            Diskon hanya muncul di struk kalau transaksi memang memakai diskon. Contoh di pratinjau
            memakai diskon supaya terlihat.
          </p>
        </section>

        {/* 4. Footer */}
        <section className={card}>
          <h2 className="mb-4 text-lg font-bold">4. Footer</h2>
          <textarea
            id="footer"
            name="footer"
            rows={3}
            maxLength={300}
            value={s.footer}
            onChange={(e) => set("footer", e.target.value)}
            disabled={pending}
            placeholder="Terima kasih sudah berbelanja"
            className={input}
            aria-label="Footer struk"
          />
          <p className="mt-1 text-xs text-[#7183a0]">
            Bebas diisi, boleh beberapa baris. Emoji bisa tampil di layar tapi sering tidak tercetak di
            printer thermal.
          </p>
        </section>

        {/* Kertas */}
        <section className={card}>
          <h2 className="mb-4 text-lg font-bold">Ukuran kertas</h2>
          <div className="flex gap-3">
            {([58, 80] as const).map((w) => (
              <label
                key={w}
                className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                  s.paper_width === w
                    ? "border-[#3385c8] bg-[#f0f7fd] text-[#2875b4]"
                    : "border-[#d6e2ef] text-[#4a5f7d]"
                }`}
              >
                <input
                  type="radio"
                  name="paper_width"
                  value={w}
                  checked={s.paper_width === w}
                  onChange={() => set("paper_width", w)}
                  disabled={pending}
                  className="h-4 w-4 accent-[#3385c8]"
                />
                {w} mm
              </label>
            ))}
          </div>
        </section>

        {state?.error && (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {state.error}
          </p>
        )}
        {state?.savedAt && !state.error && (
          <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Pengaturan tersimpan.
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-[#3385c8] px-7 py-3.5 font-semibold text-white shadow-lg shadow-[#3385c8]/20 transition hover:bg-[#2875b4] disabled:opacity-70"
          >
            {pending ? "Menyimpan..." : "Simpan"}
          </button>
          <Link
            href="/dashboard/pengaturan"
            className="rounded-xl border border-[#d6e2ef] bg-white px-6 py-3.5 font-semibold text-[#4a5f7d] transition hover:bg-[#f7fbff]"
          >
            Kembali
          </Link>
        </div>
      </form>

      {/* Pratinjau */}
      <aside className="lg:sticky lg:top-6">
        <p className="mb-3 text-sm font-semibold text-[#4a5f7d]">Pratinjau struk</p>
        <div className="overflow-x-auto rounded-2xl bg-[#e3ebf5] p-5">
          <ReceiptView
            store={{
              name: store.name.trim() || "Nama toko",
              address: store.address.trim() || null,
              phone: store.phone.trim() || null,
              extraInfo: store.extraInfo.trim() || null,
              logoUrl,
            }}
            settings={s}
            data={sample}
          />
        </div>
        <p className="mt-2 text-xs text-[#7183a0]">
          Ukuran di layar diperkirakan sesuai lebar kertas {s.paper_width} mm. Isi dan data contoh.
        </p>
      </aside>
    </div>
  );
}
