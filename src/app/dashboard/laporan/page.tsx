import Link from "next/link";
import { requireActiveOwner } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { formatRupiah } from "@/lib/billing";
import {
  formatDateTimeWib,
  parseDateParam,
  parseRangeKind,
  rangeFor,
  type RangeKind,
} from "@/lib/format";
import { PAYMENT_LABEL } from "@/lib/pos";
import { Icon } from "@/components/icons";

type Report = {
  count: number;
  total: number;
  discount: number;
  by_method: { method: string; count: number; total: number }[];
  top_products: { name: string; qty: number; total: number }[];
  by_day: { day: string; count: number; total: number }[];
};

const EMPTY: Report = { count: 0, total: 0, discount: 0, by_method: [], top_products: [], by_day: [] };
const card = "rounded-2xl bg-white p-5 shadow-[0_15px_50px_rgba(51,133,200,0.08)]";

const TABS: { kind: RangeKind; label: string }[] = [
  { kind: "day", label: "Harian" },
  { kind: "week", label: "Mingguan" },
  { kind: "month", label: "Bulanan" },
];

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; date?: string }>;
}) {
  const { tenant } = await requireActiveOwner();
  const sp = await searchParams;

  const now = new Date();
  const kind = parseRangeKind(sp.range);
  const date = parseDateParam(sp.date, now);
  const range = rangeFor(kind, date);

  const { data } = await supabaseAdmin.rpc("sales_report", {
    p_tenant: tenant.id,
    p_from: range.from.toISOString(),
    p_to: range.to.toISOString(),
  });
  const report = { ...EMPTY, ...((data as Partial<Report> | null) ?? {}) };

  const supabase = await createClient();
  const { data: txs } = await supabase
    .from("transactions")
    .select("id, number, total, payment_method, created_at")
    .eq("tenant_id", tenant.id)
    .gte("created_at", range.from.toISOString())
    .lt("created_at", range.to.toISOString())
    .order("created_at", { ascending: false })
    .limit(20);

  const avg = report.count > 0 ? Math.round(report.total / report.count) : 0;
  const dayMap = new Map(report.by_day.map((d) => [d.day, d]));
  const maxDay = Math.max(1, ...report.by_day.map((d) => d.total));
  const nextDisabled = range.to > now;

  const href = (k: RangeKind, d?: string) => `/dashboard/laporan?range=${k}${d ? `&date=${d}` : ""}`;
  const navBtn =
    "flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#4a5f7d] ring-1 ring-[#d6e2ef] transition hover:bg-[#e8f3fc]";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Laporan</h1>
          <p className="mt-1 text-sm text-[#7183a0]">Ringkasan penjualan tokomu.</p>
          <Link href="/dashboard/laporan/shift" className="mt-1 inline-block text-sm font-semibold text-[#3385c8] hover:underline">
            Riwayat kas (buka/tutup kasir) →
          </Link>
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

      {/* Navigasi periode */}
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

      {/* Ringkasan */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className={card}>
          <p className="text-sm text-[#7183a0]">Jumlah transaksi</p>
          <p className="mt-1 text-2xl font-bold">{report.count}</p>
        </div>
        <div className={card}>
          <p className="text-sm text-[#7183a0]">Total penjualan</p>
          <p className="mt-1 text-2xl font-bold">{formatRupiah(report.total)}</p>
        </div>
        <div className={card}>
          <p className="text-sm text-[#7183a0]">Rata-rata per transaksi</p>
          <p className="mt-1 text-2xl font-bold">{formatRupiah(avg)}</p>
        </div>
        <div className={card}>
          <p className="text-sm text-[#7183a0]">Diskon diberikan</p>
          <p className="mt-1 text-2xl font-bold">{formatRupiah(report.discount)}</p>
        </div>
      </div>

      {/* Grafik per hari (mingguan / bulanan) */}
      {kind !== "day" && (
        <section className={card}>
          <h2 className="mb-4 text-lg font-bold">Penjualan per hari</h2>
          <div className="flex h-40 items-end gap-1">
            {range.days.map((d) => {
              const row = dayMap.get(d);
              const pct = row ? Math.max((row.total / maxDay) * 100, 3) : 0;
              return (
                <div
                  key={d}
                  title={`${d}: ${formatRupiah(row?.total ?? 0)} (${row?.count ?? 0} transaksi)`}
                  className="flex h-full flex-1 items-end"
                >
                  <div className="w-full rounded-t bg-[#3385c8]" style={{ height: `${pct}%` }} />
                </div>
              );
            })}
          </div>
          <div className="mt-1 flex gap-1">
            {range.days.map((d) => (
              <span key={d} className="flex-1 text-center text-[10px] text-[#7183a0]">
                {Number(d.slice(8))}
              </span>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Produk terlaris */}
        <section className={card}>
          <h2 className="mb-4 text-lg font-bold">Produk terlaris</h2>
          {report.top_products.length === 0 ? (
            <p className="py-6 text-center text-sm text-[#7183a0]">Belum ada penjualan.</p>
          ) : (
            <ol className="space-y-3">
              {report.top_products.map((p, i) => (
                <li key={p.name} className="flex items-center gap-3 text-sm">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#e8f3fc] text-xs font-bold text-[#2875b4]">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-semibold">{p.name}</span>
                  <span className="text-[#7183a0]">{p.qty} terjual</span>
                  <span className="w-24 text-right font-semibold">{formatRupiah(p.total)}</span>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* Metode pembayaran */}
        <section className={card}>
          <h2 className="mb-4 text-lg font-bold">Metode pembayaran</h2>
          {report.by_method.length === 0 ? (
            <p className="py-6 text-center text-sm text-[#7183a0]">Belum ada penjualan.</p>
          ) : (
            <ul className="space-y-4">
              {report.by_method.map((m) => {
                const pct = report.total > 0 ? Math.round((m.total / report.total) * 100) : 0;
                return (
                  <li key={m.method} className="text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{PAYMENT_LABEL[m.method] ?? m.method}</span>
                      <span className="text-[#7183a0]">
                        {m.count} transaksi · {formatRupiah(m.total)}
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#eef2f7]">
                      <div className="h-full rounded-full bg-[#3385c8]" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* Transaksi */}
      <section className={card}>
        <h2 className="mb-4 text-lg font-bold">
          Transaksi {report.count > 20 ? "(20 terbaru)" : ""}
        </h2>
        {(txs ?? []).length === 0 ? (
          <p className="py-6 text-center text-sm text-[#7183a0]">Tidak ada transaksi pada periode ini.</p>
        ) : (
          <ul className="divide-y divide-[#eef2f7]">
            {(txs ?? []).map((t) => (
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
    </div>
  );
}
