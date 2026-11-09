import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { formatRupiah } from "@/lib/billing";
import { formatClock, formatDateTimeWib } from "@/lib/format";
import { UUID_RE } from "@/lib/pos";
import { CloseShiftForm, OpenShiftForm } from "@/app/dashboard/kasir/shift/shift-forms";

const card = "rounded-2xl bg-white p-5 shadow-[0_15px_50px_rgba(51,133,200,0.08)] sm:p-6";

type Shift = {
  id: string;
  opened_at: string;
  opening_cash: number;
  closed_at: string | null;
  counted_cash: number | null;
  expected_cash: number | null;
  difference: number | null;
  tx_count: number | null;
  total_sales: number | null;
  cash_sales: number | null;
  open_note: string | null;
  close_note: string | null;
};

const COLUMNS =
  "id, opened_at, opening_cash, closed_at, counted_cash, expected_cash, difference, tx_count, total_sales, cash_sales, open_note, close_note";

function Diff({ value }: { value: number }) {
  const tone = value === 0 ? "text-emerald-600" : value > 0 ? "text-[#2875b4]" : "text-red-600";
  return (
    <span className={`font-bold ${tone}`}>
      {value === 0 ? "Pas" : value > 0 ? `Lebih ${formatRupiah(value)}` : `Kurang ${formatRupiah(-value)}`}
    </span>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 text-sm">
      <span className="text-[#7183a0]">{label}</span>
      <span className="text-right font-semibold">{value}</span>
    </div>
  );
}

/** Halaman Kas: buka kasir (modal awal), tutup kasir, dan riwayatnya. Dipakai owner dan kasir. */
export default async function ShiftPageContent({
  userId,
  doneId,
}: {
  userId: string;
  doneId?: string;
}) {
  const supabase = await createClient();

  // RLS: pemakai hanya melihat shift miliknya sendiri (owner melihat semua, tapi di sini difilter ke dirinya).
  const [{ data: openData }, { data: historyData }] = await Promise.all([
    supabase.from("cash_shifts").select(COLUMNS).eq("user_id", userId).is("closed_at", null).maybeSingle(),
    supabase
      .from("cash_shifts")
      .select(COLUMNS)
      .eq("user_id", userId)
      .not("closed_at", "is", null)
      .order("closed_at", { ascending: false })
      .limit(10),
  ]);
  const open = openData as Shift | null;
  const history = (historyData ?? []) as Shift[];
  const done = doneId && UUID_RE.test(doneId) ? history.find((s) => s.id === doneId) : undefined;

  // Perkiraan uang di laci untuk shift yang sedang berjalan
  let cashSoFar = 0;
  let salesSoFar = 0;
  let txSoFar = 0;
  if (open) {
    const until = new Date();
    until.setSeconds(until.getSeconds() + 1);
    const { data } = await supabaseAdmin.rpc("shift_totals", {
      p_user: userId,
      p_from: open.opened_at,
      p_to: until.toISOString(),
    });
    const t = (data ?? {}) as { cash_sales?: number; total_sales?: number; tx_count?: number };
    cashSoFar = t.cash_sales ?? 0;
    salesSoFar = t.total_sales ?? 0;
    txSoFar = t.tx_count ?? 0;
  }
  const expected = (open?.opening_cash ?? 0) + cashSoFar;

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Kas</h1>
        <p className="mt-1 text-sm text-[#7183a0]">Modal awal dan tutup kasir.</p>
      </div>

      {done && (
        <section className={`${card} border-2 border-emerald-200`}>
          <h2 className="mb-2 text-lg font-bold">Kasir ditutup</h2>
          <div className="divide-y divide-[#eef2f7]">
            <Row label="Modal awal" value={formatRupiah(done.opening_cash)} />
            <Row label="Penjualan tunai" value={formatRupiah(done.cash_sales ?? 0)} />
            <Row label="Seharusnya di laci" value={formatRupiah(done.expected_cash ?? 0)} />
            <Row label="Dihitung di laci" value={formatRupiah(done.counted_cash ?? 0)} />
            <Row label="Selisih" value={<Diff value={done.difference ?? 0} />} />
            <Row label="Transaksi · total penjualan" value={`${done.tx_count ?? 0} · ${formatRupiah(done.total_sales ?? 0)}`} />
          </div>
        </section>
      )}

      {open ? (
        <>
          <section className={card}>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-lg font-bold">Kasir sedang dibuka</h2>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                sejak {formatClock(open.opened_at)}
              </span>
            </div>
            <div className="divide-y divide-[#eef2f7]">
              <Row label="Modal awal" value={formatRupiah(open.opening_cash)} />
              <Row label="Penjualan tunai sejauh ini" value={formatRupiah(cashSoFar)} />
              <Row label="Perkiraan uang di laci" value={formatRupiah(expected)} />
              <Row label="Transaksi · total penjualan" value={`${txSoFar} · ${formatRupiah(salesSoFar)}`} />
            </div>
            <p className="mt-3 text-xs text-[#7183a0]">
              Penjualan non-tunai (QRIS, debit, transfer) tidak masuk hitungan uang di laci.
            </p>
          </section>
          <CloseShiftForm expected={expected} />
        </>
      ) : (
        <OpenShiftForm suggested={history[0]?.counted_cash ?? null} />
      )}

      {history.length > 0 && (
        <section className={card}>
          <h2 className="mb-3 text-lg font-bold">Riwayat shift saya</h2>
          <ul className="divide-y divide-[#eef2f7]">
            {history.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <span>
                  <span className="font-semibold">{formatDateTimeWib(s.opened_at)}</span>
                  <span className="block text-xs text-[#7183a0]">
                    Modal {formatRupiah(s.opening_cash)} · {s.tx_count ?? 0} transaksi
                  </span>
                </span>
                <Diff value={s.difference ?? 0} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
