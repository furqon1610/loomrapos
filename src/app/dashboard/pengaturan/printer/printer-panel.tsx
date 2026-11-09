"use client";

import Link from "next/link";
import { useState } from "react";
import {
  connectPrinter,
  disconnectPrinter,
  setAutoPrint,
  usePrinter,
} from "@/lib/bluetooth-printer";
import { printTest } from "@/lib/print-receipt";
import { Icon } from "@/components/icons";

const card = "rounded-2xl bg-white p-5 shadow-[0_15px_50px_rgba(51,133,200,0.08)] sm:p-6";
const btn =
  "flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition disabled:opacity-60";

export default function PrinterPanel({
  paperWidth,
  canEditReceipt = true,
}: {
  paperWidth: 58 | 80;
  canEditReceipt?: boolean;
}) {
  const printer = usePrinter();
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const connected = printer.status === "connected";
  const connecting = printer.status === "connecting";

  async function onConnect() {
    setMessage(null);
    try {
      await connectPrinter();
    } catch {
      /* pesan error sudah ada di state printer */
    }
  }

  async function onTest() {
    setMessage(null);
    setTesting(true);
    try {
      await printTest(paperWidth);
      setMessage({ ok: true, text: "Halaman tes dikirim ke printer." });
    } catch (e) {
      setMessage({ ok: false, text: (e as Error)?.message || "Gagal mencetak halaman tes." });
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Status */}
      <section className={card}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                connected ? "bg-emerald-50 text-emerald-600" : "bg-[#f0f6fc] text-[#7183a0]"
              }`}
            >
              <Icon name="printer" className="h-6 w-6" />
            </span>
            <div>
              <p className="font-semibold">
                {connected ? printer.deviceName : connecting ? "Menghubungkan..." : "Belum terhubung"}
              </p>
              <p className="text-sm text-[#7183a0]">
                {connected ? "Terhubung lewat Bluetooth" : "Nyalakan printer, lalu tekan Hubungkan."}
              </p>
            </div>
          </div>

          {printer.supported &&
            (connected ? (
              <button
                type="button"
                onClick={() => {
                  setMessage(null);
                  disconnectPrinter();
                }}
                className={`${btn} border border-[#d6e2ef] bg-white text-[#4a5f7d] hover:bg-[#f7fbff]`}
              >
                Putuskan
              </button>
            ) : (
              <button
                type="button"
                onClick={onConnect}
                disabled={connecting}
                className={`${btn} bg-[#3385c8] text-white hover:bg-[#2875b4]`}
              >
                {connecting ? "Mencari printer..." : "Hubungkan printer"}
              </button>
            ))}
        </div>

        {!printer.supported && (
          <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {printer.secure
              ? "Browser ini tidak mendukung Bluetooth. Pakai Chrome di Android atau komputer (iPhone/iPad dan Safari tidak didukung)."
              : "Bluetooth hanya bisa dipakai lewat alamat https. Buka aplikasi lewat alamat https, atau localhost saat di komputer."}
          </p>
        )}
        {printer.error && (
          <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {printer.error}
          </p>
        )}
      </section>

      {/* Tes & opsi */}
      <section className={card}>
        <h2 className="mb-4 text-lg font-bold">Pengaturan cetak</h2>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Ukuran kertas: {paperWidth} mm</p>
            {canEditReceipt ? (
              <Link
                href="/dashboard/pengaturan/struk"
                className="text-xs font-semibold text-[#3385c8] hover:underline"
              >
                Ubah di pengaturan Struk
              </Link>
            ) : (
              <p className="text-xs text-[#7183a0]">Diatur oleh owner.</p>
            )}
          </div>
          <button
            type="button"
            onClick={onTest}
            disabled={!connected || testing}
            className={`${btn} border border-[#d6e2ef] bg-white text-[#2875b4] hover:bg-[#e8f3fc]`}
          >
            {testing ? "Mencetak..." : "Cetak halaman tes"}
          </button>
        </div>

        {message && (
          <p
            role={message.ok ? "status" : "alert"}
            className={`mt-3 rounded-xl px-4 py-3 text-sm ${
              message.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
            }`}
          >
            {message.text}
          </p>
        )}

        <label className="mt-5 flex cursor-pointer items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={printer.autoPrint}
            onChange={(e) => setAutoPrint(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[#3385c8]"
          />
          <span>
            <span className="font-semibold">Cetak otomatis setelah pembayaran</span>
            <span className="block text-xs text-[#7183a0]">
              Struk langsung dikirim ke printer begitu transaksi selesai (kalau printer sedang
              terhubung). Pengaturan ini berlaku untuk perangkat ini saja.
            </span>
          </span>
        </label>
      </section>

      {/* Bantuan */}
      <section className={card}>
        <h2 className="mb-3 text-lg font-bold">Printer tidak muncul?</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm text-[#4a5f7d]">
          <li>
            Pastikan printer menyala, kertas terpasang, dan <strong>belum tersambung ke HP lain</strong>.
          </li>
          <li>
            Nyalakan <strong>Bluetooth dan Lokasi</strong> di HP (Android butuh Lokasi untuk mencari perangkat).
          </li>
          <li>
            Jangan pasangkan (pair) printer lewat pengaturan Bluetooth HP lebih dulu. Cukup tekan Hubungkan di sini.
          </li>
          <li>
            Browser hanya bisa menyambung ke printer <strong>Bluetooth LE</strong>. Printer Bluetooth klasik
            tidak akan muncul di daftar.
          </li>
          <li>Setelah halaman dimuat ulang, tekan Hubungkan lagi.</li>
        </ul>
      </section>
    </div>
  );
}
