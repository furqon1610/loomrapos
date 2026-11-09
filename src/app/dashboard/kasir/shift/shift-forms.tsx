"use client";

import { startTransition, useActionState, useState, type FormEvent } from "react";
import NumberField from "@/components/NumberField";
import { formatRupiah } from "@/lib/billing";
import { formatThousands, onlyDigits } from "@/lib/number-format";
import { closeShift, openShift, type ShiftState } from "./actions";

const card = "rounded-2xl bg-white p-5 shadow-[0_15px_50px_rgba(51,133,200,0.08)] sm:p-6";
const textarea =
  "w-full rounded-xl border border-[#d6e2ef] bg-white px-4 py-3 text-sm outline-none transition placeholder:text-[#9aabc0] focus:border-[#3385c8] focus:ring-4 focus:ring-[#3385c8]/10 disabled:opacity-60";
const submit =
  "w-full rounded-xl py-4 font-semibold text-white shadow-lg transition disabled:opacity-60";

function useSubmit(action: (data: FormData) => void) {
  return (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => action(data));
  };
}

export function OpenShiftForm({ suggested }: { suggested: number | null }) {
  const [state, action, pending] = useActionState<ShiftState, FormData>(openShift, null);

  return (
    <form onSubmit={useSubmit(action)} className={`${card} space-y-4`}>
      <div>
        <h2 className="text-lg font-bold">Buka kasir</h2>
        <p className="mt-1 text-sm text-[#7183a0]">
          Catat modal awal, yaitu uang tunai yang disiapkan di laci untuk kembalian.
        </p>
      </div>

      <NumberField
        id="opening"
        label="Modal awal"
        prefix="Rp"
        maxDigits={9}
        defaultValue={suggested ?? 0}
        disabled={pending}
        placeholder="0"
        hint={
          suggested !== null
            ? "Diisi dari uang di laci pada penutupan terakhir. Ubah kalau berbeda."
            : "Isi 0 kalau tidak memakai modal awal."
        }
      />

      <div>
        <label htmlFor="note" className="mb-2 block text-sm font-semibold">
          Catatan (opsional)
        </label>
        <textarea id="note" name="note" rows={2} maxLength={200} disabled={pending} className={textarea} />
      </div>

      {state?.error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className={`${submit} bg-[#3385c8] shadow-[#3385c8]/20 hover:bg-[#2875b4]`}>
        {pending ? "Membuka..." : "Buka kasir"}
      </button>
    </form>
  );
}

export function CloseShiftForm({ expected }: { expected: number }) {
  const [state, action, pending] = useActionState<ShiftState, FormData>(closeShift, null);
  const [counted, setCounted] = useState("");

  const diff = Number(counted) - expected;

  return (
    <form onSubmit={useSubmit(action)} className={`${card} space-y-4`}>
      <div>
        <h2 className="text-lg font-bold">Tutup kasir</h2>
        <p className="mt-1 text-sm text-[#7183a0]">
          Hitung semua uang tunai di laci, lalu isi jumlahnya. Perkiraan sistem:{" "}
          <strong>{formatRupiah(expected)}</strong>.
        </p>
      </div>

      <div>
        <label htmlFor="counted" className="mb-2 block text-sm font-semibold">
          Uang tunai di laci
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm font-semibold text-[#7183a0]">
            Rp
          </span>
          <input
            id="counted"
            name="counted"
            inputMode="numeric"
            autoComplete="off"
            required
            disabled={pending}
            value={formatThousands(counted)}
            onChange={(e) => setCounted(onlyDigits(e.target.value, 10))}
            placeholder="0"
            className="w-full rounded-xl border border-[#d6e2ef] bg-white py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-[#3385c8] focus:ring-4 focus:ring-[#3385c8]/10 disabled:opacity-60"
          />
        </div>
        {counted !== "" && (
          <p
            className={`mt-2 text-sm font-semibold ${
              diff === 0 ? "text-emerald-600" : diff > 0 ? "text-[#2875b4]" : "text-red-600"
            }`}
          >
            {diff === 0
              ? "Pas, tidak ada selisih."
              : diff > 0
                ? `Lebih ${formatRupiah(diff)}`
                : `Kurang ${formatRupiah(-diff)}`}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="close-note" className="mb-2 block text-sm font-semibold">
          Catatan (opsional)
        </label>
        <textarea
          id="close-note"
          name="note"
          rows={2}
          maxLength={200}
          disabled={pending}
          placeholder="Contoh: ada uang keluar untuk beli es batu"
          className={textarea}
        />
      </div>

      {state?.error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className={`${submit} bg-[#102a4c] shadow-[#102a4c]/20 hover:bg-[#0c2039]`}>
        {pending ? "Menutup..." : "Tutup kasir"}
      </button>
    </form>
  );
}
