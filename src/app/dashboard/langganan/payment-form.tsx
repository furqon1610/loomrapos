"use client";

import { useActionState, useState } from "react";
import { submitPayment, type PaymentState } from "./actions";

export type PaymentOption = {
  pkg: "basic" | "pro";
  label: string;
  amountText: string;
  creditText: string | null;
};

export default function PaymentForm({
  options,
  qrisUrl,
  merchantName,
}: {
  options: PaymentOption[];
  qrisUrl: string | null;
  merchantName: string | null;
}) {
  const [state, formAction, pending] = useActionState<PaymentState, FormData>(
    submitPayment,
    null,
  );
  const [selected, setSelected] = useState(options[0].pkg);
  const current = options.find((o) => o.pkg === selected) ?? options[0];

  return (
    <form action={formAction} className="space-y-6">
      <fieldset className="space-y-3">
        <legend className="mb-1 text-sm font-semibold text-[#102a4c]">Pilih paket</legend>
        {options.map((o) => (
          <label
            key={o.pkg}
            className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-4 transition ${
              selected === o.pkg
                ? "border-[#3385c8] bg-[#f0f7fd]"
                : "border-[#d6e2ef] bg-white"
            }`}
          >
            <span className="flex items-center gap-3">
              <input
                type="radio"
                name="package"
                value={o.pkg}
                checked={selected === o.pkg}
                onChange={() => setSelected(o.pkg)}
                disabled={pending}
                className="h-4 w-4 accent-[#3385c8]"
              />
              <span className="font-semibold">{o.label}</span>
            </span>
            <span className="text-sm font-bold text-[#102a4c]">{o.amountText}</span>
          </label>
        ))}
        {current.creditText && (
          <p className="text-xs text-[#7183a0]">{current.creditText}</p>
        )}
      </fieldset>

      <div className="rounded-xl bg-[#f7fbff] p-5 text-center">
        <p className="text-sm text-[#7183a0]">Scan QRIS, lalu transfer tepat sebesar</p>
        <p className="mt-1 text-3xl font-bold text-[#102a4c]">{current.amountText}</p>

        {qrisUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrisUrl}
              alt="QRIS pembayaran LoomraPOS"
              className="mx-auto mt-4 w-full max-w-xs rounded-xl bg-white p-2"
            />
            {merchantName && (
              <p className="mt-3 text-sm font-medium text-[#102a4c]">{merchantName}</p>
            )}
            <p className="mt-2 text-xs text-[#7183a0]">
              Nominal diketik manual saat membayar. Pastikan sama persis.
            </p>
          </>
        ) : (
          <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
            QRIS belum tersedia. Hubungi admin LoomraPOS.
          </p>
        )}
      </div>

      <div>
        <label htmlFor="proof" className="mb-2 block text-sm font-semibold text-[#102a4c]">
          Upload bukti pembayaran
        </label>
        <input
          id="proof"
          name="proof"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required
          disabled={pending}
          className="block w-full rounded-xl border border-[#d6e2ef] bg-white p-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[#e8f3fc] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[#2875b4]"
        />
        <p className="mt-1.5 text-xs text-[#7183a0]">JPG, PNG, atau WebP, maksimal 5 MB.</p>
      </div>

      {state?.error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !qrisUrl}
        className="flex w-full items-center justify-center rounded-xl bg-[#3385c8] py-4 font-semibold text-white shadow-lg shadow-[#3385c8]/20 transition hover:bg-[#2875b4] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Mengirim..." : "Kirim bukti pembayaran"}
      </button>
    </form>
  );
}
