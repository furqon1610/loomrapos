"use client";

import { Icon } from "@/components/icons";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="flex items-center gap-2 rounded-xl bg-[#3385c8] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2875b4]"
    >
      <Icon name="printer" className="h-5 w-5" />
      Cetak / simpan struk
    </button>
  );
}
