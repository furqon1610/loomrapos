"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { connectPrinter, getPrinterState, usePrinter } from "@/lib/bluetooth-printer";
import { printReceipt } from "@/lib/print-receipt";
import type { ReceiptSettings } from "@/lib/receipt";
import type { ReceiptData, ReceiptStore } from "@/lib/receipt-layout";

type Phase = { kind: "idle" } | { kind: "printing" } | { kind: "done" } | { kind: "error"; message: string };

async function execute(
  store: ReceiptStore,
  settings: ReceiptSettings,
  data: ReceiptData,
  connectFirst: boolean,
): Promise<Phase> {
  try {
    if (connectFirst) await connectPrinter(); // harus dari klik pengguna
    if (getPrinterState().status !== "connected") return { kind: "idle" }; // pilih perangkat dibatalkan
    await printReceipt(store, settings, data);
    return { kind: "done" };
  } catch (e) {
    return { kind: "error", message: (e as Error)?.message || "Gagal mencetak." };
  }
}

export default function PrintBluetoothButton({
  store,
  settings,
  data,
  autoPrintKey,
}: {
  store: ReceiptStore;
  settings: ReceiptSettings;
  data: ReceiptData;
  /** Kunci unik (id transaksi) supaya cetak otomatis hanya sekali per transaksi. */
  autoPrintKey: string;
}) {
  const printer = usePrinter();
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const autoDone = useRef(false);

  // Cetak otomatis: hanya kalau diaktifkan, printer sudah terhubung, dan belum pernah dicetak.
  useEffect(() => {
    if (!printer.autoPrint || printer.status !== "connected" || autoDone.current) return;
    const key = `printed:${autoPrintKey}`;
    try {
      if (window.sessionStorage.getItem(key)) return;
      window.sessionStorage.setItem(key, "1");
    } catch {
      /* tanpa penyimpanan: tetap cetak sekali per tampilan */
    }
    autoDone.current = true;
    void Promise.resolve()
      .then(() => setPhase({ kind: "printing" }))
      .then(() => execute(store, settings, data, false))
      .then(setPhase);
  }, [printer.autoPrint, printer.status, autoPrintKey, store, settings, data]);

  async function onClick() {
    setPhase({ kind: "printing" });
    setPhase(await execute(store, settings, data, printer.status !== "connected"));
  }

  if (!printer.supported) {
    return (
      <p className="max-w-sm text-center text-xs text-[#7183a0]">
        {printer.secure
          ? "Cetak langsung ke printer Bluetooth butuh Chrome di Android atau komputer."
          : "Cetak Bluetooth butuh alamat https."}
      </p>
    );
  }

  const connected = printer.status === "connected";
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={phase.kind === "printing" || printer.status === "connecting"}
        className="flex items-center gap-2 rounded-xl bg-[#3385c8] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2875b4] disabled:opacity-60"
      >
        <Icon name="printer" className="h-5 w-5" />
        {phase.kind === "printing"
          ? "Mencetak..."
          : connected
            ? `Cetak ke ${printer.deviceName}`
            : "Hubungkan & cetak ke printer"}
      </button>
      {phase.kind === "done" && <p className="text-xs font-semibold text-emerald-600">Struk terkirim ke printer.</p>}
      {phase.kind === "error" && (
        <p role="alert" className="max-w-sm text-center text-xs text-red-600">
          {phase.message}
        </p>
      )}
    </div>
  );
}
