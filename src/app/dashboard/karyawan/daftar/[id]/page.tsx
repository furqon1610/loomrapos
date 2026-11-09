import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProOwner } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";
import { getEmployeeReport } from "@/lib/employees";
import { formatRupiah } from "@/lib/billing";
import { formatClock, formatDuration, formatShortDate, parseDateParam, rangeFor } from "@/lib/format";
import { UUID_RE } from "@/lib/pos";
import ConfirmForm from "../../confirm-form";
import {
  Collapsible,
  CreateAccountForm,
  EditEmployeeForm,
  PinForm,
  ResetAccountPasswordForm,
} from "../../employee-forms";
import { manualAttendance, setEmployeeActive, toggleAccountActive } from "../../actions";

const card = "rounded-2xl bg-white p-5 shadow-[0_15px_50px_rgba(51,133,200,0.08)] sm:p-6";

type Emp = {
  id: string;
  user_id: string | null;
  name: string;
  job_title: string | null;
  phone: string | null;
  hired_on: string | null;
  note: string | null;
  active: boolean;
  has_pin: boolean;
};
type Session = {
  id: string;
  work_date: string;
  clock_in: string;
  clock_out: string | null;
  auto_closed: boolean;
  source: "self" | "pin" | "owner";
};

const SOURCE: Record<Session["source"], string> = { self: "Akun sendiri", pin: "PIN", owner: "Manual owner" };

export default async function EmployeeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();
  const { tenant } = await requireProOwner();
  const { error, ok } = await searchParams;

  const supabase = await createClient();
  const { data } = await supabase
    .from("employees")
    .select("id, user_id, name, job_title, phone, hired_on, note, active, has_pin")
    .eq("id", id)
    .eq("tenant_id", tenant.id)
    .maybeSingle();
  if (!data) notFound();
  const emp = data as Emp;

  const now = new Date();
  const month = rangeFor("month", parseDateParam(undefined, now));

  const [{ data: sessionData }, { data: account }, { count: activeAccounts }, report] = await Promise.all([
    supabase
      .from("attendance")
      .select("id, work_date, clock_in, clock_out, auto_closed, source")
      .eq("employee_id", emp.id)
      .order("clock_in", { ascending: false })
      .limit(60),
    emp.user_id
      ? supabase.from("profiles").select("id, username, active").eq("id", emp.user_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenant.id)
      .eq("role", "cashier")
      .eq("active", true),
    emp.user_id ? getEmployeeReport(tenant.id, month.from, month.to) : Promise.resolve([]),
  ]);

  const sessions = (sessionData ?? []) as Session[];
  const open = sessions.find((s) => !s.clock_out);
  const monthSessions = sessions.filter((s) => new Date(s.clock_in) >= month.from && new Date(s.clock_in) < month.to);
  const daysPresent = new Set(monthSessions.map((s) => s.work_date)).size;
  const workMs = monthSessions.reduce(
    (sum, s) => sum + (new Date(s.clock_out ?? now).getTime() - new Date(s.clock_in).getTime()),
    0,
  );
  const sales = report.find((r) => r.user_id === emp.user_id);
  const acc = account as { id: string; username: string; active: boolean } | null;
  const accountsFull = (activeAccounts ?? 0) >= 3;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <Link href="/dashboard/karyawan/daftar" className="text-sm font-semibold text-[#3385c8] hover:underline">
          ← Semua karyawan
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">{emp.name}</h1>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              emp.active ? "bg-emerald-50 text-emerald-700" : "bg-[#f0f2f5] text-[#7183a0]"
            }`}
          >
            {emp.active ? "Aktif" : "Nonaktif"}
          </span>
        </div>
        <p className="mt-1 text-sm text-[#7183a0]">
          {emp.job_title ?? "Tanpa jabatan"}
          {emp.hired_on ? ` · masuk ${formatShortDate(`${emp.hired_on}T00:00:00+07:00`)}` : ""}
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}
      {ok && (
        <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {ok}
        </p>
      )}

      {/* Ringkasan bulan ini */}
      <section className={card}>
        <h2 className="mb-4 text-lg font-bold">Bulan ini · {month.label}</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-[#f4f8fd] p-4">
            <p className="text-xs text-[#7183a0]">Hari hadir</p>
            <p className="mt-1 text-xl font-bold">{daysPresent}</p>
          </div>
          <div className="rounded-xl bg-[#f4f8fd] p-4">
            <p className="text-xs text-[#7183a0]">Total jam kerja</p>
            <p className="mt-1 text-xl font-bold">{formatDuration(workMs)}</p>
          </div>
          <div className="rounded-xl bg-[#f4f8fd] p-4">
            <p className="text-xs text-[#7183a0]">Penjualan</p>
            <p className="mt-1 text-xl font-bold">{emp.user_id ? formatRupiah(sales?.total ?? 0) : "—"}</p>
            {emp.user_id && <p className="text-[11px] text-[#7183a0]">{sales?.tx_count ?? 0} transaksi</p>}
          </div>
        </div>

        {emp.active && (
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-[#eef2f7] pt-4">
            <ConfirmForm
              action={manualAttendance}
              fields={{ id: emp.id }}
              label={open ? "Catat clock-out manual" : "Catat clock-in manual"}
              confirmMessage={`${open ? "Clock-out" : "Clock-in"} ${emp.name} sekarang?`}
            />
            <span className="text-xs text-[#7183a0]">
              {open ? `Sedang bekerja sejak ${formatClock(open.clock_in)}.` : "Untuk koreksi kalau karyawan lupa absen."}
            </span>
          </div>
        )}
      </section>

      <EditEmployeeForm
        values={{
          id: emp.id,
          name: emp.name,
          jobTitle: emp.job_title ?? "",
          phone: emp.phone ?? "",
          hiredOn: emp.hired_on ?? "",
          note: emp.note ?? "",
        }}
      />

      <PinForm id={emp.id} hasPin={emp.has_pin} />

      {/* Akun login */}
      <section className={card}>
        <h2 className="mb-1 text-lg font-bold">Akun login kasir</h2>
        <p className="mb-4 text-sm text-[#7183a0]">
          Hanya untuk karyawan yang memakai Kasir. {activeAccounts ?? 0} dari 3 akun terpakai.
        </p>

        {acc ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">@{acc.username}</p>
                <span
                  className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                    acc.active ? "bg-emerald-50 text-emerald-700" : "bg-[#f0f2f5] text-[#7183a0]"
                  }`}
                >
                  {acc.active ? "Akun aktif" : "Akun nonaktif"}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Collapsible label="Reset password">
                  <ResetAccountPasswordForm id={emp.id} />
                </Collapsible>
                <ConfirmForm
                  action={toggleAccountActive}
                  fields={{ id: emp.id, active: acc.active ? "0" : "1" }}
                  label={acc.active ? "Nonaktifkan akun" : "Aktifkan akun"}
                  confirmMessage={acc.active ? `Nonaktifkan akun @${acc.username}? Dia tidak bisa login sampai diaktifkan lagi.` : undefined}
                  tone={acc.active ? "danger" : "success"}
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            {accountsFull && (
              <p className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Batas 3 akun kasir aktif sudah tercapai. Nonaktifkan akun karyawan lain untuk membuat akun baru.
              </p>
            )}
            <CreateAccountForm id={emp.id} disabled={accountsFull || !emp.active} />
          </>
        )}
      </section>

      {/* Riwayat absensi */}
      <section className={card}>
        <h2 className="mb-4 text-lg font-bold">Riwayat absensi</h2>
        {sessions.length === 0 ? (
          <p className="py-6 text-center text-sm text-[#7183a0]">Belum ada absensi.</p>
        ) : (
          <ul className="divide-y divide-[#eef2f7]">
            {sessions.slice(0, 20).map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <span className="font-semibold">{formatShortDate(`${s.work_date}T00:00:00+07:00`)}</span>
                <span className="text-[#4a5f7d]">
                  {formatClock(s.clock_in)} – {s.clock_out ? formatClock(s.clock_out) : "sekarang"}
                  {s.auto_closed && (
                    <span className="ml-2 rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">otomatis</span>
                  )}
                </span>
                <span className="text-xs text-[#7183a0]">
                  {SOURCE[s.source]} · {formatDuration(new Date(s.clock_out ?? now).getTime() - new Date(s.clock_in).getTime())}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Aktif / nonaktif */}
      <section className={`${card} flex flex-wrap items-center justify-between gap-3`}>
        <div>
          <p className="font-semibold">{emp.active ? "Nonaktifkan karyawan" : "Aktifkan kembali karyawan"}</p>
          <p className="text-xs text-[#7183a0]">
            {emp.active
              ? "Tidak bisa absen lagi. Akun login (kalau ada) ikut dinonaktifkan. Riwayatnya tetap tersimpan."
              : "Karyawan bisa absen lagi, dan akun login (kalau ada) ikut aktif."}
          </p>
        </div>
        <ConfirmForm
          action={setEmployeeActive}
          fields={{ id: emp.id, active: emp.active ? "0" : "1" }}
          label={emp.active ? "Nonaktifkan" : "Aktifkan"}
          confirmMessage={emp.active ? `Nonaktifkan ${emp.name}?` : undefined}
          tone={emp.active ? "danger" : "success"}
        />
      </section>
    </div>
  );
}
