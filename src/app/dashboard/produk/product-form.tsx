"use client";

import Link from "next/link";
import { useActionState, useState, startTransition, type FormEvent } from "react";
import Field from "@/components/Field";
import NumberField from "@/components/NumberField";
import ImagePicker from "@/components/owner/ImagePicker";
import { saveProduct, type ProductState } from "./actions";

export type ProductInitial = {
  id: string;
  name: string;
  price: number;
  stock: number;
  track_stock: boolean;
  category: string | null;
  imageUrl: string | null;
};

export default function ProductForm({
  initial,
  categories,
}: {
  initial?: ProductInitial;
  categories: string[];
}) {
  const [state, formAction, pending] = useActionState<ProductState, FormData>(saveProduct, null);
  const [trackStock, setTrackStock] = useState(initial?.track_stock ?? true);

  // Dikirim lewat onSubmit (bukan prop action) supaya isian tidak ter-reset kalau ada error.
  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => formAction(data));
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {initial && <input type="hidden" name="id" value={initial.id} />}

      <ImagePicker currentUrl={initial?.imageUrl ?? null} pending={pending} />

      <Field
        id="name"
        label="Nama produk"
        type="text"
        required
        maxLength={80}
        defaultValue={initial?.name ?? ""}
        disabled={pending}
        placeholder="Contoh: Es Teh"
      />

      <div>
        <Field
          id="category"
          label="Kategori (opsional)"
          type="text"
          list="category-options"
          maxLength={40}
          defaultValue={initial?.category ?? ""}
          disabled={pending}
          placeholder="Pilih atau ketik kategori baru"
        />
        <datalist id="category-options">
          {categories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>

      <NumberField
        id="price"
        label="Harga"
        prefix="Rp"
        required
        maxDigits={9}
        defaultValue={initial?.price}
        disabled={pending}
        placeholder="5.000"
      />

      <div className="rounded-xl bg-[#f7fbff] p-4">
        <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold">
          <input
            type="checkbox"
            name="trackStock"
            checked={trackStock}
            onChange={(e) => setTrackStock(e.target.checked)}
            disabled={pending}
            className="h-4 w-4 accent-[#3385c8]"
          />
          Kelola stok produk ini
        </label>
        <p className="mt-1 pl-7 text-xs text-[#7183a0]">
          Matikan untuk produk tanpa stok (misalnya minuman yang dibuat langsung).
        </p>
        {trackStock && (
          <div className="mt-4">
            <NumberField
              id="stock"
              label="Stok"
              maxDigits={7}
              defaultValue={initial?.stock ?? 0}
              disabled={pending}
            />
          </div>
        )}
      </div>

      {state?.error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {state.error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-[#3385c8] px-6 py-3.5 font-semibold text-white transition hover:bg-[#2875b4] disabled:opacity-70"
        >
          {pending ? "Menyimpan..." : "Simpan"}
        </button>
        <Link
          href="/dashboard/produk"
          className="rounded-xl border border-[#d6e2ef] bg-white px-6 py-3.5 font-semibold text-[#4a5f7d] transition hover:bg-[#f7fbff]"
        >
          Batal
        </Link>
      </div>
    </form>
  );
}
