"use client";

import { Icon } from "@/components/icons";

export default function DeleteProductButton({
  id,
  name,
  action,
}: {
  id: string;
  name: string;
  action: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(`Hapus produk "${name}"? Riwayat transaksi tetap tersimpan.`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        aria-label={`Hapus ${name}`}
        title="Hapus"
        className="rounded-lg p-2 text-[#7183a0] transition hover:bg-red-50 hover:text-red-600"
      >
        <Icon name="trash" className="h-[18px] w-[18px]" />
      </button>
    </form>
  );
}
