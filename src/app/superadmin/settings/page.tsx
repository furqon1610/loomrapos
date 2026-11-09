import { supabaseAdmin } from "@/lib/supabase/admin";
import QrisForm from "./qris-form";
import PushToggle from "./push-toggle";
import { isPushConfigured } from "@/lib/webpush";

export default async function SettingsPage() {
  const { data: settings } = await supabaseAdmin
    .from("app_settings")
    .select("key, value")
    .in("key", ["qris_path", "qris_merchant_name"]);
  const map = Object.fromEntries((settings ?? []).map((s) => [s.key, s.value as string]));

  let currentUrl: string | null = null;
  if (map.qris_path) {
    const { data } = await supabaseAdmin.storage
      .from("app-assets")
      .createSignedUrl(map.qris_path, 3600);
    currentUrl = data?.signedUrl ?? null;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="rounded-2xl bg-white p-6 shadow-[0_15px_50px_rgba(51,133,200,0.10)]">
        <h2 className="mb-1 text-lg font-bold">QRIS pembayaran</h2>
        <p className="mb-5 text-sm text-[#7183a0]">
          QRIS ini ditampilkan ke owner di halaman Langganan.
        </p>
        <QrisForm currentUrl={currentUrl} merchantName={map.qris_merchant_name ?? ""} />
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-[0_15px_50px_rgba(51,133,200,0.08)]">
        <h2 className="mb-1 text-lg font-bold">Notifikasi</h2>
        <p className="mb-5 text-sm text-[#7183a0]">
          Terima notifikasi di perangkat ini saat ada pengajuan pembayaran atau tenant baru. Aktifkan di
          setiap perangkat yang ingin menerimanya.
        </p>
        <PushToggle
          publicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""}
          configured={isPushConfigured()}
        />
      </div>
    </div>
  );
}
