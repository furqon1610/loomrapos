import Link from "next/link";
import { requireActiveOwner } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";
import { formatRupiah } from "@/lib/billing";
import { formatDateTimeWib } from "@/lib/format";

const card = "rounded-2xl bg-white p-5 shadow-[0_15px_50px_rgba(51,133,200,0.08)]";

type Shift = {
  id: string;
  user_id: string;
  opened_at: string;
  closed_at: string | null;
  opening_cash: number;
  expected_cash: number | null;
  counted_cash: number | null;
  difference: number | null;
  cash_sales: number | null;
  tx_count: number | null;
  close_note: string | null;
};

export default async function ShiftReportPage() {
  const { tenant } = await requireActiveOwner();
  const supabase = await createClient();

  // RLS: owner melihat shift semua orang di tokonya.
  const [{ data: shiftData }, { data: people }] = await Promise.all([
    supabase
      .from("cash_shifts")
      .select("id, user_id, opened_at, closed_at, opening_cash, expected_cash, counted_cash, difference, cash_sales, tx_count, close_note")
      .eq("tenant_id", tenant.id)
      .order("opened_at", { ascending: false })
      .limit(50),
    supabase.from("profiles").select("id, username, full_name").eq("tenant_id", tenant.id),
  ]);

  const shifts = (shiftData ?? []) as Shift[];
  const nameOf = new Map(
    (people ?? []).map((p) => [p.id as string, ((p.full_name as string | null) ?? p.username) as string]),
  );
  const closed = shifts.filter((s) => s.closed_at);
  const totalDiff = closed.reduce((sum, s) => sum + (s.difference ?? 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Riwayat Kas</h1>
          <p className="mt-1 text-sm text-[#7183a0]">Buka dan tutup kasir, lengkap dengan selisih uang di laci.</p>
        </div>
        <Link href="/dashboard/laporan" className="text-sm font-semibold text-[#3385c8] hover:underline">
          ← Kembali ke Laporan
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className={card}>
          <p className="text-sm text-[#7183a0]">Shift ditutup (50 terakhir)</p>
          <p className="mt-1 text-2xl font-bold">{closed.length}</p>
        </div>
        <div className={card}>
          <p className="text-sm text-[#7183a0]">Total selisih</p>
          <p
            className={`mt-1 text-2xl font-bold ${
              totalDiff === 0 ? "" : totalDiff > 0 ? "text-[#2875b4]" : "text-red-600"
            }`}
          >
            {totalDiff > 0 ? "+" : totalDiff < 0 ? "-" : ""}
            {formatRupiah(Math.abs(totalDiff))}
          </p>
        </div>
      </div>

      <section className={card}>
        {shifts.length === 0 ? (
          <p className="py-8 text-center text-sm text-[#7183a0]">Belum ada shift kas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-[#f4f8fd] text-xs font-semibold text-[#5b6f8e]">
                <tr>
                  <th className="px-3 py-3">Petugas</th>
                  <th className="px-3 py-3">Dibuka</th>
                  <th className="px-3 py-3">Ditutup</th>
                  <th className="px-3 py-3 text-right">Modal</th>
                  <th className="px-3 py-3 text-right">Tunai</th>
                  <th className="px-3 py-3 text-right">Seharusnya</th>
                  <th className="px-3 py-3 text-right">Dihitung</th>
                  <th className="px-3 py-3 text-right">Selisih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eef2f7]">
                {shifts.map((s) => (
                  <tr key={s.id}>
                    <td className="px-3 py-3 font-semibold">{nameOf.get(s.user_id) ?? "-"}</td>
                    <td className="px-3 py-3 text-[#4a5f7d]">{formatDateTimeWib(s.opened_at)}</td>
                    <td className="px-3 py-3 text-[#4a5f7d]">
                      {s.closed_at ? (
                        formatDateTimeWib(s.closed_at)
                      ) : (
                        <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                          Berjalan
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right">{formatRupiah(s.opening_cash)}</td>
                    <td className="px-3 py-3 text-right">{s.closed_at ? formatRupiah(s.cash_sales ?? 0) : "-"}</td>
                    <td className="px-3 py-3 text-right">{s.closed_at ? formatRupiah(s.expected_cash ?? 0) : "-"}</td>
                    <td className="px-3 py-3 text-right">{s.closed_at ? formatRupiah(s.counted_cash ?? 0) : "-"}</td>
                    <td
                      className={`px-3 py-3 text-right font-bold ${
                        !s.closed_at || s.difference === 0
                          ? "text-[#7183a0]"
                          : (s.difference ?? 0) > 0
                            ? "text-[#2875b4]"
                            : "text-red-600"
                      }`}
                    >
                      {!s.closed_at
                        ? "-"
                        : s.difference === 0
                          ? "Pas"
                          : `${(s.difference ?? 0) > 0 ? "+" : "-"}${formatRupiah(Math.abs(s.difference ?? 0))}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
