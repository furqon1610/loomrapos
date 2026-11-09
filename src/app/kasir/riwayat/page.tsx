import Link from "next/link";
import { getCashierContext } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";
import { formatRupiah } from "@/lib/billing";
import { formatDateTimeWib, rangeFor, todayWIB } from "@/lib/format";
import { PAYMENT_LABEL } from "@/lib/pos";

const card = "rounded-2xl bg-white p-5 shadow-[0_15px_50px_rgba(51,133,200,0.08)]";

export default async function CashierHistoryPage() {
  const { profile, tenant, blocked } = await getCashierContext();
  if (blocked || !tenant) return null;

  const today = rangeFor("day", todayWIB());
  const supabase = await createClient();

  // RLS: kasir hanya melihat transaksinya sendiri.
  const [{ data: txs }, { data: todayTxs }] = await Promise.all([
    supabase
      .from("transactions")
      .select("id, number, total, payment_method, created_at")
      .eq("cashier_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("transactions")
      .select("total")
      .eq("cashier_id", profile.id)
      .gte("created_at", today.from.toISOString())
      .lt("created_at", today.to.toISOString())
      .limit(1000),
  ]);

  const todayTotal = (todayTxs ?? []).reduce((sum, t) => sum + (t.total as number), 0);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Riwayat Transaksi</h1>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className={card}>
          <p className="text-sm text-[#7183a0]">Transaksi saya hari ini</p>
          <p className="mt-1 text-2xl font-bold">{(todayTxs ?? []).length}</p>
        </div>
        <div className={card}>
          <p className="text-sm text-[#7183a0]">Penjualan saya hari ini</p>
          <p className="mt-1 text-2xl font-bold">{formatRupiah(todayTotal)}</p>
        </div>
      </div>

      <section className={card}>
        <h2 className="mb-4 text-lg font-bold">50 transaksi terakhir</h2>
        {(txs ?? []).length === 0 ? (
          <p className="py-6 text-center text-sm text-[#7183a0]">Belum ada transaksi.</p>
        ) : (
          <ul className="divide-y divide-[#eef2f7]">
            {(txs ?? []).map((t) => (
              <li key={t.id}>
                <Link
                  href={`/kasir/struk/${t.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm transition hover:bg-[#f7fbff]"
                >
                  <span>
                    <span className="font-semibold">{t.number}</span>
                    <span className="ml-2 text-[#7183a0]">{formatDateTimeWib(t.created_at)}</span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="rounded-md bg-[#f0f6fc] px-2 py-1 text-xs font-semibold text-[#4a5f7d]">
                      {PAYMENT_LABEL[t.payment_method] ?? t.payment_method}
                    </span>
                    <span className="font-bold">{formatRupiah(t.total)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
