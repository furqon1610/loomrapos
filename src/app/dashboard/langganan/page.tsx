import { getOwnerContext } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  PACKAGE_LABEL,
  computePayment,
  formatDate,
  formatRupiah,
  packageOptions,
} from "@/lib/billing";
import SubscriptionStatus from "@/components/SubscriptionStatus";
import PaymentForm, { type PaymentOption } from "./payment-form";

const STATUS_TEXT: Record<string, { text: string; tone: string }> = {
  pending: { text: "Menunggu verifikasi", tone: "bg-amber-50 text-amber-700" },
  approved: { text: "Disetujui", tone: "bg-emerald-50 text-emerald-700" },
  rejected: { text: "Ditolak", tone: "bg-red-50 text-red-600" },
};

const card = "rounded-2xl bg-white p-6 shadow-[0_15px_50px_rgba(51,133,200,0.10)]";

export default async function LanggananPage() {
  const { tenant, access, hasPending } = await getOwnerContext();
  const supabase = await createClient();

  const { data: payments } = await supabase
    .from("subscription_payments")
    .select("id, package, amount, status, review_note, created_at")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const pending = (payments ?? []).find((p) => p.status === "pending");

  // QRIS milik LoomraPOS (diatur superadmin di Settings), dibaca lewat server.
  const { data: settings } = await supabaseAdmin
    .from("app_settings")
    .select("key, value")
    .in("key", ["qris_path", "qris_merchant_name"]);
  const map = Object.fromEntries((settings ?? []).map((s) => [s.key, s.value as string]));

  let qrisUrl: string | null = null;
  if (map.qris_path) {
    const { data } = await supabaseAdmin.storage
      .from("app-assets")
      .createSignedUrl(map.qris_path, 3600);
    qrisUrl = data?.signedUrl ?? null;
  }

  const now = new Date();
  const options: PaymentOption[] = packageOptions(tenant, now).map((pkg) => {
    const { amount, credit, remainingDays } = computePayment(tenant, pkg, now);
    return {
      pkg,
      label: PACKAGE_LABEL[pkg],
      amountText: formatRupiah(amount),
      creditText:
        credit > 0
          ? `Sudah dipotong kredit sisa Basic ${remainingDays} hari (${formatRupiah(credit)}).`
          : null,
    };
  });

  const locked = access.state === "locked";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Langganan</h1>

      <div className={card}>
        <SubscriptionStatus tenant={tenant} access={access} />
        {!access.ok && !locked && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            Akun toko terkunci. Lakukan pembayaran di bawah untuk mengaktifkannya kembali.
          </p>
        )}
      </div>

      {locked ? (
        <div className={card}>
          <p className="text-sm text-[#7183a0]">
            Akun toko ini dikunci oleh admin LoomraPOS. Hubungi admin untuk informasi lebih lanjut.
          </p>
        </div>
      ) : hasPending ? (
        <div className={card}>
          <p className="font-semibold">Pembayaran sedang diverifikasi</p>
          <p className="mt-2 text-sm text-[#7183a0]">
            {pending
              ? `${PACKAGE_LABEL[pending.package as "basic" | "pro"]} · ${formatRupiah(pending.amount)} · dikirim ${formatDate(pending.created_at)}. `
              : ""}
            Akun tetap bisa dipakai selama menunggu. Paket akan aktif setelah admin menyetujui.
          </p>
        </div>
      ) : (
        <div className={card}>
          <h2 className="mb-5 text-lg font-bold">
            {access.state === "expired" ? "Aktifkan kembali" : "Bayar / upgrade paket"}
          </h2>
          <PaymentForm
            options={options}
            qrisUrl={qrisUrl}
            merchantName={map.qris_merchant_name ?? null}
          />
        </div>
      )}

      {(payments ?? []).length > 0 && (
        <div className={card}>
          <h2 className="mb-4 text-lg font-bold">Riwayat pembayaran</h2>
          <ul className="divide-y divide-[#eef2f7]">
            {(payments ?? []).map((p) => {
              const s = STATUS_TEXT[p.status as string];
              return (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <p className="text-sm font-semibold">
                      {PACKAGE_LABEL[p.package as "basic" | "pro"]} · {formatRupiah(p.amount)}
                    </p>
                    <p className="text-xs text-[#7183a0]">
                      {formatDate(p.created_at)}
                      {p.review_note ? ` — ${p.review_note}` : ""}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${s.tone}`}>
                    {s.text}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
