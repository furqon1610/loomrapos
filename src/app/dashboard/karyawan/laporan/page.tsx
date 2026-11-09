import Link from "next/link";
import { requireProOwner } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";
import { getEmployeeReport, visibleEmployees } from "@/lib/employees";
import { formatRupiah } from "@/lib/billing";
import {
  formatDateTimeWib,
  parseDateParam,
  parseRangeKind,
  rangeFor,
  type RangeKind,
} from "@/lib/format";
import { PAYMENT_LABEL, UUID_RE } from "@/lib/pos";
import { Icon } from "@/components/icons";

const card = "rounded-2xl bg-white p-5 shadow-[0_15px_50px_rgba(51,133,200,0.08)]";

const TABS: { kind: RangeKind; label: string }[] = [
  { kind: "day", label: "Harian" },
  { kind: "week", label: "Mingguan" },
  { kind: "month", label: "Bulanan" },
];

export default async function EmployeeReportPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; date?: string; u?: string }>;
}) {
  const { tenant } = await requireProOwner();
  const sp = await searchParams;

  const now = new Date();
  const kind = parseRangeKind(sp.range);
  const date = parseDateParam(sp.date, now);
  const range = rangeFor(kind, date);

  const rows = visibleEmployees(await getEmployeeReport(tenant.id, range.from, range.to));
  const totalTx = rows.reduce((s, r) => s + r.tx_count, 0);
  const totalSales = rows.reduce((s, r) => s + r.total, 0);

  // Riwayat transaksi satu orang (kalau dipilih)
  const selected = sp.u && UUID_RE.test(sp.u) ? rows.find((r) => r.user_id === sp.u) : undefined;
  let txs: { id: string; number: string; total: number; payment_method: string; created_at: string }[] = [];
  if (selected) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("transactions")
      .select("id, number, total, payment_method, created_at")
      .eq("tenant_id", tenant.id)
      .eq("cashier_id", selected.user_id)
      .gte("created_at", range.from.toISOString())
      .lt("created_at", range.to.toISOString())
      .order("created_at", { ascending: false })
      .limit(50);
    txs = (data ?? []) as typeof txs;
  }

  const base = "/dashboard/karyawan/laporan";
  const href = (k: RangeKind, d?: string, u?: string) =>
    `${base}?range=${k}${d ? `&date=${d}` : ""}${u ? `&u=${u}` : ""}`;
  const nextDisabled = range.to > now;
  const navBtn =
    "flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#4a5f7d] ring-1 ring-[#d6e2ef] transition hover:bg-[#e8f3fc]";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Laporan Karyawan</h1>
          <p className="mt-1 text-sm text-[#7183a0]">Transaksi dan penjualan tiap karyawan.</p>
        </div>
        <div className="flex gap-1 rounded-xl bg-white p-1 ring-1 ring-[#d6e2ef]">
          {TABS.map((t) => (
            <Link
              key={t.kind}
              href={href(t.kind, date)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                kind === t.kind ? "bg-[#3385c8] text-white" : "text-[#4a5f7d] hover:bg-[#f0f6fc]"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link href={href(kind, range.prev)} aria-label="Periode sebelumnya" className={navBtn}>
          <span className="rotate-180">
            <Icon name="arrowRight" className="h-5 w-5" />
          </span>
        </Link>
        <div className="flex-1 rounded-xl bg-white px-4 py-2.5 text-center text-sm font-semibold ring-1 ring-[#d6e2ef]">
          {range.label}
        </div>
        {nextDisabled ? (
          <span aria-hidden="true" className={`${navBtn} opacity-40`}>
            <Icon name="arrowRight" className="h-5 w-5" />
          </span>
        ) : (
          <Link href={href(kind, range.next)} aria-label="Periode berikutnya" className={navBtn}>
            <Icon name="arrowRight" className="h-5 w-5" />
          </Link>
        )}
        <Link
          href={href(kind)}
          className="rounded-xl bg-[#e8f3fc] px-4 py-2.5 text-sm font-semibold text-[#2875b4] transition hover:bg-[#d8ebfa]"
        >
          Hari ini
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className={card}>
          <p className="text-sm text-[#7183a0]">Total transaksi</p>
          <p className="mt-1 text-2xl font-bold">{totalTx}</p>
        </div>
        <div className={card}>
          <p className="text-sm text-[#7183a0]">Total penjualan</p>
          <p className="mt-1 text-2xl font-bold">{formatRupiah(totalSales)}</p>
        </div>
      </div>

      <section className={card}>
        <h2 className="mb-4 text-lg font-bold">Per karyawan</h2>
        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-[#7183a0]">Belum ada karyawan atau transaksi.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-[#f4f8fd] text-xs font-semibold text-[#5b6f8e]">
                <tr>
                  <th className="px-3 py-3">Nama</th>
                  <th className="px-3 py-3 text-right">Transaksi</th>
                  <th className="px-3 py-3 text-right">Penjualan</th>
                  <th className="px-3 py-3 text-right">Rata-rata</th>
                  <th className="px-3 py-3">Porsi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eef2f7]">
                {rows.map((r) => {
                  const pct = totalSales > 0 ? Math.round((r.total / totalSales) * 100) : 0;
                  const isSel = selected?.user_id === r.user_id;
                  return (
                    <tr key={r.user_id} className={isSel ? "bg-[#f0f7fd]" : ""}>
                      <td className="px-3 py-3">
                        <Link
                          href={isSel ? href(kind, date) : href(kind, date, r.user_id)}
                          className="font-semibold text-[#102a4c] hover:text-[#2875b4] hover:underline"
                        >
                          {r.name}
                        </Link>
                        <p className="text-xs text-[#7183a0]">
                          @{r.username}
                          {r.role === "owner" ? " · Owner" : !r.active ? " · Nonaktif" : ""}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-right">{r.tx_count}</td>
                      <td className="px-3 py-3 text-right font-semibold">{formatRupiah(r.total)}</td>
                      <td className="px-3 py-3 text-right text-[#4a5f7d]">
                        {r.tx_count > 0 ? formatRupiah(Math.round(r.total / r.tx_count)) : "-"}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-[#eef2f7]">
                            <div className="h-full rounded-full bg-[#3385c8]" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-[#7183a0]">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-xs text-[#7183a0]">Klik nama untuk melihat riwayat transaksinya.</p>
      </section>

      {selected && (
        <section className={card}>
          <h2 className="mb-4 text-lg font-bold">
            Riwayat transaksi {selected.name}
            {selected.tx_count > 50 ? " (50 terbaru)" : ""}
          </h2>
          {txs.length === 0 ? (
            <p className="py-6 text-center text-sm text-[#7183a0]">Tidak ada transaksi pada periode ini.</p>
          ) : (
            <ul className="divide-y divide-[#eef2f7]">
              {txs.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/dashboard/kasir/struk/${t.id}`}
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
      )}
    </div>
  );
}
