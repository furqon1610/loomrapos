import { getCashierContext } from "@/lib/tenant";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { formatClock, formatLongDate, rangeFor, todayWIB } from "@/lib/format";
import AttendanceKiosk, { type KioskEmployee } from "./attendance-kiosk";

type Session = { employee_id: string; clock_in: string; clock_out: string | null };

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { profile, tenant, blocked } = await getCashierContext();
  if (blocked || !tenant) return null;
  const { error, ok } = await searchParams;

  const now = new Date();
  const today = rangeFor("day", todayWIB(now));

  // Dibaca lewat server karena kasir tidak boleh membaca data karyawan lain secara langsung.
  const [{ data: empData }, { data: todayData }, { data: openData }] = await Promise.all([
    supabaseAdmin
      .from("employees")
      .select("id, name, job_title, user_id, has_pin")
      .eq("tenant_id", tenant.id)
      .eq("active", true)
      .order("name"),
    supabaseAdmin
      .from("attendance")
      .select("employee_id, clock_in, clock_out")
      .eq("tenant_id", tenant.id)
      .gte("clock_in", today.from.toISOString())
      .lt("clock_in", today.to.toISOString()),
    supabaseAdmin
      .from("attendance")
      .select("employee_id, clock_in, clock_out")
      .eq("tenant_id", tenant.id)
      .is("clock_out", null),
  ]);

  const sessions = [...((todayData ?? []) as Session[]), ...((openData ?? []) as Session[])];

  const employees: KioskEmployee[] = (empData ?? []).map((e) => {
    const mine = sessions.filter((s) => s.employee_id === e.id);
    const open = mine.find((s) => !s.clock_out);
    const state: KioskEmployee["state"] = open ? "working" : mine.length > 0 ? "done" : "none";
    return {
      id: e.id as string,
      name: e.name as string,
      jobTitle: (e.job_title as string | null) ?? null,
      hasPin: e.has_pin === true,
      isMe: e.user_id === profile.id,
      state,
      label: open ? `Bekerja ${formatClock(open.clock_in)}` : mine.length > 0 ? "Sudah pulang" : "Belum hadir",
    };
  });

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Absensi</h1>
        <p className="mt-1 text-sm text-[#7183a0]">
          {formatLongDate(now)} · Pilih nama karyawan lalu masukkan PIN-nya.
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}
      {ok && (
        <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {ok}
        </p>
      )}

      <AttendanceKiosk employees={employees} />
    </div>
  );
}
