import Link from "next/link";
import { requireProOwner } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";
import { formatClock, formatDuration, formatShortDate, parseDateParam, rangeFor } from "@/lib/format";
import { Icon } from "@/components/icons";

const card = "rounded-2xl bg-white p-5 shadow-[0_15px_50px_rgba(51,133,200,0.08)]";

type Session = {
  id: string;
  employee_id: string;
  source: "self" | "pin" | "owner";
  work_date: string;
  clock_in: string;
  clock_out: string | null;
  auto_closed: boolean;
};

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { tenant } = await requireProOwner();
  const sp = await searchParams;

  const now = new Date();
  const range = rangeFor("month", parseDateParam(sp.date, now));
  const supabase = await createClient();

  const [{ data: sessionData }, { data: people }] = await Promise.all([
    supabase
      .from("attendance")
      .select("id, employee_id, source, work_date, clock_in, clock_out, auto_closed")
      .eq("tenant_id", tenant.id)
      .gte("clock_in", range.from.toISOString())
      .lt("clock_in", range.to.toISOString())
      .order("clock_in", { ascending: false })
      .limit(1000),
    supabase.from("employees").select("id, name, job_title, active").eq("tenant_id", tenant.id).order("name"),
  ]);

  const sessions = (sessionData ?? []) as Session[];
  const nameOf = new Map((people ?? []).map((p) => [p.id as string, p.name as string]));

  const summary = (people ?? [])
    .map((p) => {
      const mine = sessions.filter((s) => s.employee_id === p.id);
      const days = new Set(mine.map((s) => s.work_date)).size;
      const ms = mine.reduce((sum, s) => sum + (new Date(s.clock_out ?? now).getTime() - new Date(s.clock_in).getTime()), 0);
      return {
        id: p.id as string,
        name: p.name as string,
        title: (p.job_title as string | null) ?? "—",
        active: p.active as boolean,
        days,
        sessions: mine.length,
        ms,
      };
    })
    .filter((s) => s.active || s.sessions > 0);

  const nextDisabled = range.to > now;
  const navBtn =
    "flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#4a5f7d] ring-1 ring-[#d6e2ef] transition hover:bg-[#e8f3fc]";
  const href = (d: string) => `/dashboard/karyawan/absensi?date=${d}`;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Absensi</h1>
        <p className="mt-1 text-sm text-[#7183a0]">Riwayat clock-in dan clock-out semua karyawan per bulan.</p>
      </div>

      <div className="flex items-center gap-2">
        <Link href={href(range.prev)} aria-label="Bulan sebelumnya" className={navBtn}>
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
          <Link href={href(range.next)} aria-label="Bulan berikutnya" className={navBtn}>
            <Icon name="arrowRight" className="h-5 w-5" />
          </Link>
        )}
        <Link
          href="/dashboard/karyawan/absensi"
          className="rounded-xl bg-[#e8f3fc] px-4 py-2.5 text-sm font-semibold text-[#2875b4] transition hover:bg-[#d8ebfa]"
        >
          Bulan ini
        </Link>
      </div>

      <section className={card}>
        <h2 className="mb-4 text-lg font-bold">Ringkasan per karyawan</h2>
        {summary.length === 0 ? (
          <p className="py-8 text-center text-sm text-[#7183a0]">Belum ada karyawan.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="bg-[#f4f8fd] text-xs font-semibold text-[#5b6f8e]">
                <tr>
                  <th className="px-3 py-3">Nama</th>
                  <th className="px-3 py-3 text-right">Hari hadir</th>
                  <th className="px-3 py-3 text-right">Sesi</th>
                  <th className="px-3 py-3 text-right">Total jam kerja</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eef2f7]">
                {summary.map((s) => (
                  <tr key={s.id}>
                    <td className="px-3 py-3">
                      <p className="font-semibold">{s.name}</p>
                      <p className="text-xs text-[#7183a0]">
                        {s.title}
                        {!s.active ? " · Nonaktif" : ""}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-right">{s.days}</td>
                    <td className="px-3 py-3 text-right">{s.sessions}</td>
                    <td className="px-3 py-3 text-right font-semibold">{formatDuration(s.ms)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className={card}>
        <h2 className="mb-4 text-lg font-bold">Riwayat absensi</h2>
        {sessions.length === 0 ? (
          <p className="py-6 text-center text-sm text-[#7183a0]">Tidak ada absensi pada bulan ini.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="bg-[#f4f8fd] text-xs font-semibold text-[#5b6f8e]">
                <tr>
                  <th className="px-3 py-3">Tanggal</th>
                  <th className="px-3 py-3">Nama</th>
                  <th className="px-3 py-3">Masuk</th>
                  <th className="px-3 py-3">Pulang</th>
                  <th className="px-3 py-3 text-right">Durasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eef2f7]">
                {sessions.map((s) => (
                  <tr key={s.id}>
                    <td className="px-3 py-3 text-[#4a5f7d]">{formatShortDate(`${s.work_date}T00:00:00+07:00`)}</td>
                    <td className="px-3 py-3 font-semibold">{nameOf.get(s.employee_id) ?? "-"}</td>
                    <td className="px-3 py-3">{formatClock(s.clock_in)}</td>
                    <td className="px-3 py-3">
                      {s.clock_out ? (
                        <>
                          {formatClock(s.clock_out)}
                          {s.auto_closed && (
                            <span
                              title="Karyawan lupa clock-out; ditutup otomatis di akhir hari"
                              className="ml-2 rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700"
                            >
                              otomatis
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                          Bekerja
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right">
                      {formatDuration(new Date(s.clock_out ?? now).getTime() - new Date(s.clock_in).getTime())}
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
