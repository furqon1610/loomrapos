"use client";

import { useActionState, useState } from "react";
import { createTenant, type OnboardingState } from "./actions";
import Field from "@/components/Field";

const PLANS = [
  {
    id: "basic",
    name: "Basic",
    price: "Rp99.000",
    features: ["Kasir & struk", "Produk & stok", "Laporan penjualan", "Printer Bluetooth"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "Rp299.000",
    features: [
      "Semua fitur Basic",
      "Hingga 3 akun kasir",
      "Absensi karyawan",
      "Laporan & monitoring karyawan",
    ],
  },
] as const;

export default function OnboardingForm({
  businessTypes,
  defaultPackage,
}: {
  businessTypes: string[];
  defaultPackage: "basic" | "pro";
}) {
  const [state, formAction, pending] = useActionState<OnboardingState, FormData>(
    createTenant,
    null,
  );
  const [plan, setPlan] = useState<"basic" | "pro">(defaultPackage);

  return (
    <form action={formAction} className="space-y-5">
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-[#102a4c]">Pilih paket</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {PLANS.map((p) => (
            <label
              key={p.id}
              className={`cursor-pointer rounded-xl border p-4 transition ${
                plan === p.id ? "border-[#3385c8] bg-[#f0f7fd]" : "border-[#d6e2ef] bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-[#102a4c]">{p.name}</p>
                  <p className="text-sm font-semibold text-[#3385c8]">
                    {p.price}
                    <span className="font-normal text-[#7183a0]">/bulan</span>
                  </p>
                </div>
                <input
                  type="radio"
                  name="package"
                  value={p.id}
                  checked={plan === p.id}
                  onChange={() => setPlan(p.id)}
                  disabled={pending}
                  className="mt-1 h-4 w-4 accent-[#3385c8]"
                />
              </div>
              <ul className="mt-3 space-y-1 text-xs text-[#4a5f7d]">
                {p.features.map((f) => (
                  <li key={f}>✓ {f}</li>
                ))}
              </ul>
            </label>
          ))}
        </div>
        <p className="mt-2 text-xs text-[#7183a0]">
          Gratis 14 hari untuk kedua paket, tanpa kartu kredit. Pembayaran baru diminta setelah
          trial berakhir, dan paket bisa diganti kapan saja.
        </p>
      </fieldset>

      <Field
        id="name"
        label="Nama toko"
        type="text"
        required
        defaultValue={state?.values.name ?? ""}
        disabled={pending}
        placeholder="Contoh: Warkop Agus"
      />

      <div>
        <label htmlFor="businessType" className="mb-2 block text-sm font-semibold text-[#102a4c]">
          Jenis usaha
        </label>
        <select
          id="businessType"
          name="businessType"
          required
          defaultValue={state?.values.businessType ?? ""}
          disabled={pending}
          className="w-full rounded-xl border border-[#d6e2ef] bg-white px-4 py-3.5 text-sm text-[#102a4c] outline-none transition focus:border-[#3385c8] focus:ring-4 focus:ring-[#3385c8]/10 disabled:opacity-60"
        >
          <option value="" disabled>
            Pilih jenis usaha
          </option>
          {businessTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <Field
        id="address"
        label="Alamat (opsional)"
        type="text"
        maxLength={200}
        defaultValue={state?.values.address ?? ""}
        disabled={pending}
        placeholder="Alamat toko"
      />
      <Field
        id="phone"
        label="Nomor telepon (opsional)"
        type="tel"
        autoComplete="tel"
        defaultValue={state?.values.phone ?? ""}
        disabled={pending}
        placeholder="08xxxxxxxxxx"
      />

      {state?.error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#3385c8] py-4 font-semibold text-white shadow-lg shadow-[#3385c8]/20 transition hover:bg-[#2875b4] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Membuat toko..." : "Buat Toko"}
      </button>
    </form>
  );
}
