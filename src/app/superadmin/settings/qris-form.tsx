"use client";

import { useActionState } from "react";
import { saveQris, type QrisState } from "./actions";

export default function QrisForm({
  currentUrl,
  merchantName,
}: {
  currentUrl: string | null;
  merchantName: string;
}) {
  const [state, formAction, pending] = useActionState<QrisState, FormData>(saveQris, null);

  return (
    <form action={formAction} className="space-y-5">
      {currentUrl && (
        <div>
          <p className="mb-2 text-sm font-semibold">QRIS saat ini</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentUrl}
            alt="QRIS saat ini"
            className="w-full max-w-xs rounded-xl border border-[#d6e2ef] bg-white p-2"
          />
        </div>
      )}

      <div>
        <label htmlFor="qris" className="mb-2 block text-sm font-semibold">
          {currentUrl ? "Ganti gambar QRIS (opsional)" : "Gambar QRIS"}
        </label>
        <input
          id="qris"
          name="qris"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={pending}
          className="block w-full rounded-xl border border-[#d6e2ef] bg-white p-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[#e8f3fc] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[#2875b4]"
        />
      </div>

      <div>
        <label htmlFor="merchantName" className="mb-2 block text-sm font-semibold">
          Nama merchant
        </label>
        <input
          id="merchantName"
          name="merchantName"
          type="text"
          required
          maxLength={80}
          defaultValue={merchantName}
          disabled={pending}
          placeholder="Nama yang tampil saat scan"
          className="w-full rounded-xl border border-[#d6e2ef] bg-white px-4 py-3.5 text-sm outline-none focus:border-[#3385c8] focus:ring-4 focus:ring-[#3385c8]/10 disabled:opacity-60"
        />
      </div>

      {state?.error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Pengaturan tersimpan.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-[#3385c8] px-6 py-3.5 font-semibold text-white transition hover:bg-[#2875b4] disabled:opacity-70"
      >
        {pending ? "Menyimpan..." : "Simpan"}
      </button>
    </form>
  );
}
