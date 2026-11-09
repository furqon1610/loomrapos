import { supabaseAdmin } from "@/lib/supabase/admin";
import { formatDate, formatRupiah, PACKAGE_LABEL, type Package } from "@/lib/billing";
import { approvePayment, rejectPayment } from "./actions";

type Payment = {
  id: string;
  tenant_id: string;
  package: Package;
  amount: number;
  proof_path: string;
  status: "pending" | "approved" | "rejected";
  review_note: string | null;
  created_at: string;
};

const card = "rounded-2xl bg-white p-6 shadow-[0_15px_50px_rgba(51,133,200,0.10)]";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const { data } = await supabaseAdmin
    .from("subscription_payments")
    .select("id, tenant_id, package, amount, proof_path, status, review_note, created_at")
    .order("created_at", { ascending: false })
    .limit(30);
  const payments = (data ?? []) as Payment[];

  const tenantIds = [...new Set(payments.map((p) => p.tenant_id))];
  const { data: tenants } = tenantIds.length
    ? await supabaseAdmin
        .from("tenants")
        .select("id, name, package, status, active_until")
        .in("id", tenantIds)
    : { data: [] };
  const tenantById = new Map((tenants ?? []).map((t) => [t.id as string, t]));

  const pending = payments.filter((p) => p.status === "pending");
  const processed = payments.filter((p) => p.status !== "pending");

  // Link sementara (1 jam) untuk melihat bukti pembayaran di bucket privat.
  const signed = pending.length
    ? await supabaseAdmin.storage
        .from("payment-proofs")
        .createSignedUrls(pending.map((p) => p.proof_path), 3600)
    : { data: [] };
  const proofUrl = new Map(
    (signed.data ?? []).map((s) => [s.path as string, s.signedUrl as string]),
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Billing</h1>

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <section className="space-y-4">
        <h2 className="font-semibold text-[#7183a0]">Menunggu verifikasi ({pending.length})</h2>
        {pending.length === 0 && (
          <div className={card}>
            <p className="text-sm text-[#7183a0]">Tidak ada pembayaran yang menunggu.</p>
          </div>
        )}

        {pending.map((p) => {
          const t = tenantById.get(p.tenant_id);
          const url = proofUrl.get(p.proof_path);
          return (
            <div key={p.id} className={`${card} grid gap-6 sm:grid-cols-[220px_1fr]`}>
              <div>
                {url ? (
                  <a href={url} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt="Bukti pembayaran"
                      className="max-h-64 w-full rounded-xl border border-[#d6e2ef] object-contain"
                    />
                  </a>
                ) : (
                  <p className="text-sm text-red-600">Bukti tidak bisa dimuat.</p>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-lg font-bold">{t?.name ?? "Tenant"}</p>
                  <p className="text-sm text-[#7183a0]">
                    Paket saat ini: {t ? PACKAGE_LABEL[t.package as Package] : "-"}
                    {t?.active_until ? ` · aktif sampai ${formatDate(t.active_until)}` : ""}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-[#7183a0]">
                    Mengajukan {PACKAGE_LABEL[p.package]} · {formatDate(p.created_at)}
                  </p>
                  <p className="text-2xl font-bold">{formatRupiah(p.amount)}</p>
                  <p className="mt-1 text-xs text-[#7183a0]">
                    Cocokkan dengan mutasi yang benar-benar masuk sebelum menyetujui.
                  </p>
                </div>

                <div className="flex flex-wrap items-start gap-3">
                  <form action={approvePayment}>
                    <input type="hidden" name="id" value={p.id} />
                    <button
                      type="submit"
                      className="rounded-xl bg-[#3385c8] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2875b4]"
                    >
                      Setujui
                    </button>
                  </form>

                  <form action={rejectPayment} className="flex flex-1 flex-wrap gap-2">
                    <input type="hidden" name="id" value={p.id} />
                    <input
                      name="note"
                      required
                      maxLength={200}
                      placeholder="Alasan penolakan"
                      className="min-w-40 flex-1 rounded-xl border border-[#d6e2ef] px-4 py-3 text-sm outline-none focus:border-[#3385c8]"
                    />
                    <button
                      type="submit"
                      className="rounded-xl border border-red-200 px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      Tolak
                    </button>
                  </form>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {processed.length > 0 && (
        <section className={card}>
          <h2 className="mb-4 font-semibold text-[#7183a0]">Riwayat</h2>
          <ul className="divide-y divide-[#eef2f7]">
            {processed.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <span>
                  <strong>{tenantById.get(p.tenant_id)?.name ?? "Tenant"}</strong> ·{" "}
                  {PACKAGE_LABEL[p.package]} · {formatRupiah(p.amount)}
                </span>
                <span className={p.status === "approved" ? "text-emerald-700" : "text-red-600"}>
                  {p.status === "approved" ? "Disetujui" : `Ditolak${p.review_note ? `: ${p.review_note}` : ""}`}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
