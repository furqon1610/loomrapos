"use client";

import Link from "next/link";
import { startTransition, useActionState, useState, type FormEvent } from "react";
import { saveOperationalSettings, type OperationalState } from "./actions";

const card = "rounded-2xl bg-white p-5 shadow-[0_15px_50px_rgba(51,133,200,0.08)] sm:p-6";

export default function OperationalForm({
  initial,
  isPro,
}: {
  initial: { requireOpenShift: boolean; requireClockIn: boolean };
  isPro: boolean;
}) {
  const [state, action, pending] = useActionState<OperationalState, FormData>(saveOperationalSettings, null);
  const [shift, setShift] = useState(initial.requireOpenShift);
  const [clock, setClock] = useState(initial.requireClockIn && isPro);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => action(data));
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <section className={`${card} space-y-5`}>
        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input
            type="checkbox"
            name="require_open_shift"
            checked={shift}
            onChange={(e) => setShift(e.target.checked)}
            disabled={pending}
            className="mt-0.5 h-4 w-4 accent-[#3385c8]"
          />
          <span>
            <span className="font-semibold">Wajib buka kasir (isi modal awal) sebelum berjualan</span>
            <span className="block text-xs text-[#7183a0]">
              Penjualan baru bisa dimulai setelah modal awal dicatat. Kalau dimatikan, buka dan tutup kasir
              tetap bisa dipakai secara opsional dari menu Kasir.
            </span>
          </span>
        </label>

        <label className={`flex items-start gap-3 text-sm ${isPro ? "cursor-pointer" : "opacity-60"}`}>
          <input
            type="checkbox"
            name="require_clock_in"
            checked={clock}
            onChange={(e) => setClock(e.target.checked)}
            disabled={pending || !isPro}
            className="mt-0.5 h-4 w-4 accent-[#3385c8]"
          />
          <span>
            <span className="font-semibold">
              Wajib clock-in sebelum berjualan{" "}
              {!isPro && (
                <span className="ml-1 rounded-full bg-[#e8f3fc] px-2 py-0.5 text-[10px] font-bold text-[#2875b4]">
                  Pro
                </span>
              )}
            </span>
            <span className="block text-xs text-[#7183a0]">
              Kasir harus mencatat kehadiran di menu Absensi dulu. Tidak berlaku untuk owner.
            </span>
          </span>
        </label>
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
  );
}
