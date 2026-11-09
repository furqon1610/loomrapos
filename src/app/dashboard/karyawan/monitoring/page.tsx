import { requireProOwner } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";
import { getEmployeeReport, visibleEmployees } from "@/lib/employees";
import { formatRupiah } from "@/lib/billing";
import { formatClock, formatDateTimeWib, formatDuration, rangeFor, timeAgo, todayWIB } from "@/lib/format";
import { Icon, type IconName } from "@/components/icons";

const card = "rounded-2xl bg-white p-5 shadow-[0_15px_50px_rgba(51,133,200,0.08)]";

type Session = { id: string; employee_id: string; clock_in: string; clock_out: string | null; auto_closed: boolean };
type Emp = { id: string; user_id: string | null; name: string; job_title: string | null };
type Activity = { at: Date; title: string; detail: string; icon: IconName; tone: string };

function Stat({ icon, tone, label, value, note }: { icon: IconName; tone: string; label: string; value: string; note?: string }) {
  return (
    <div className={`${card} !p-4`}>
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
        <Icon name={icon} className="h-5 w-5" />
      </span>
      <p className="mt-3 text-sm font-semibold">{label}</p>
      <p className="mt-0.5 text-2xl font-bold">{value}</p>
      {note && <p className="mt-1 text-[11px] leading-4 text-[#7183a0]">{note}</p>}
    </div>
  );
}

export default async function MonitoringPage() {
  const { tenant } = await requireProOwner();
  const now = new Date();
  const today = rangeFor("day", todayWIB(now));
  const supabase = await createClient();

  const [rows, { data: empData }, { data: todaySessions }, { data: openSessions }, { data: recentTx }] = await Promise.all([
    getEmployeeReport(tenant.id, today.from, today.to),
    supabase
      .from("employees")
      .select("id, user_id, name, job_title")
      .eq("tenant_id", tenant.id)
      .eq("active", true)
      .order("name"),
    supabase
      .from("attendance")
      .select("id, employee_id, clock_in, clock_out, auto_closed")
      .eq("tenant_id", tenant.id)
      .gte("clock_in", today.from.toISOString())
      .lt("clock_in", today.to.toISOString())
      .order("clock_in"),
    supabase
      .from("attendance")
      .select("id, employee_id, clock_in, clock_out, auto_closed")
      .eq("tenant_id", tenant.id)
      .is("clock_out", null),
    supabase
      .from("transactions")
      .select("id, number, total, cashier_id, created_at")
      .eq("tenant_id", tenant.id)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  // Sesi hari ini + sesi yang masih terbuka dari hari sebelumnya (lupa clock-out).
  const sessions = new Map<string, Session>();
  for (const s of [...(todaySessions ?? []), ...(openSessions ?? [])] as Session[]) sessions.set(s.id, s);
  const sessionList = [...sessions.values()].sort((a, b) => a.clock_in.localeCompare(b.clock_in));

  const employees = (empData ?? []) as Emp[];
  const empName = new Map(employees.map((e) => [e.id, e.name]));
  const reportByUser = new Map(rows.map((r) => [r.user_id, r]));
  const userName = new Map(rows.map((r) => [r.user_id, r.name]));
  // Owner yang ikut bertransaksi tampil sebagai baris tersendiri.
  const ownerRows = visibleEmployees(rows).filter((r) => r.role === "owner");

  const totalTx = rows.reduce((s, r) => s + r.tx_count, 0);
  const totalSales = rows.reduce((s, r) => s + r.total, 0);
  const present = new Set(sessionList.map((s) => s.employee_id));
  const presentCount = employees.filter((e) => present.has(e.id)).length;
  const workingNow = sessionList.filter((s) => !s.clock_out).length;

  function statusOf(employeeId: string) {
    const mine = sessionList.filter((s) => s.employee_id === employeeId);
    const open = mine.find((s) => !s.clock_out);
    if (open) {
      return {
        label: `Bekerja sejak ${formatClock(open.clock_in)}`,
        tone: "bg-emerald-50 text-emerald-700",
        note: formatDuration(now.getTime() - new Date(open.clock_in).getTime()),
      };
    }
    if (mine.length > 0) {
      const last = mine[mine.length - 1];
      const total = mine.reduce(
        (sum, s) => sum + (new Date(s.clock_out ?? now).getTime() - new Date(s.clock_in).getTime()),
        0,
      );
      return {
        label: `Selesai ${formatClock(mine[0].clock_in)}–${formatClock(last.clock_out ?? last.clock_in)}`,
        tone: "bg-[#e8f3fc] text-[#2875b4]",
        note: formatDuration(total),
      };
    }
    return { label: "Belum hadir", tone: "bg-[#f0f2f5] text-[#7183a0]", note: "" };
  }

  // Aktivitas terbaru: transaksi + clock-in/out
  const activities: Activity[] = [];
  for (const t of recentTx ?? []) {
    activities.push({
      at: new Date(t.created_at as string),
      title: `${userName.get(t.cashier_id as string) ?? "Kasir"} · ${t.number}`,
      detail: `Transaksi ${formatRupiah(t.total as number)}`,
      icon: "cart",
      tone: "bg-blue-50 text-[#3385c8]",
    });
  }
  for (const s of sessionList) {
    activities.push({
      at: new Date(s.clock_in),
      title: empName.get(s.employee_id) ?? "Karyawan",
      detail: "Clock-in",
      icon: "check",
      tone: "bg-emerald-50 text-emerald-600",
    });
    if (s.clock_out) {
      activities.push({
        at: new Date(s.clock_out),
        title: empName.get(s.employee_id) ?? "Karyawan",
        detail: s.auto_closed ? "Clock-out otomatis (lupa clock-out)" : "Clock-out",
        icon: "logout",
        tone: "bg-amber-50 text-amber-600",
      });
    }
  }
  activities.sort((a, b) => b.at.getTime() - a.at.getTime());
  const recent = activities.slice(0, 10);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Monitoring</h1>
        <p className="mt-1 text-sm text-[#7183a0]">Kondisi karyawan dan penjualan hari ini.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <Stat icon="users" tone="bg-emerald-50 text-emerald-600" label="Hadir hari ini" value={`${presentCount}/${employees.length}`} note="Karyawan aktif yang sudah clock-in" />
        <Stat icon="clock" tone="bg-purple-50 text-purple-600" label="Sedang bekerja" value={String(workingNow)} note="Belum clock-out" />
        <Stat icon="receipt" tone="bg-blue-50 text-[#3385c8]" label="Transaksi" value={String(totalTx)} />
        <Stat icon="cart" tone="bg-amber-50 text-amber-500" label="Penjualan" value={formatRupiah(totalSales)} />
      </div>

      <section className={card}>
        <h2 className="mb-4 text-lg font-bold">Karyawan hari ini</h2>
        {employees.length === 0 && ownerRows.length === 0 ? (
          <p className="py-8 text-center text-sm text-[#7183a0]">
            Belum ada karyawan. Tambahkan di tab Karyawan.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-[#f4f8fd] text-xs font-semibold text-[#5b6f8e]">
                <tr>
                  <th className="px-3 py-3">Nama</th>
                  <th className="px-3 py-3">Kehadiran</th>
                  <th className="px-3 py-3 text-right">Transaksi</th>
                  <th className="px-3 py-3 text-right">Penjualan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eef2f7]">
                {employees.map((e) => {
                  const st = statusOf(e.id);
                  const sale = e.user_id ? reportByUser.get(e.user_id) : undefined;
                  return (
                    <tr key={e.id}>
                      <td className="px-3 py-3">
                        <p className="font-semibold">{e.name}</p>
                        <p className="text-xs text-[#7183a0]">{e.job_title ?? "—"}</p>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${st.tone}`}>{st.label}</span>
                        {st.note && <span className="ml-2 text-xs text-[#7183a0]">{st.note}</span>}
                      </td>
                      <td className="px-3 py-3 text-right">{e.user_id ? (sale?.tx_count ?? 0) : "—"}</td>
                      <td className="px-3 py-3 text-right font-semibold">{e.user_id ? formatRupiah(sale?.total ?? 0) : "—"}</td>
                    </tr>
                  );
                })}
                {ownerRows.map((o) => (
                  <tr key={o.user_id}>
                    <td className="px-3 py-3">
                      <p className="font-semibold">{o.name}</p>
                      <p className="text-xs text-[#7183a0]">Owner</p>
                    </td>
                    <td className="px-3 py-3 text-[#7183a0]">—</td>
                    <td className="px-3 py-3 text-right">{o.tx_count}</td>
                    <td className="px-3 py-3 text-right font-semibold">{formatRupiah(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className={card}>
        <h2 className="mb-4 text-lg font-bold">Aktivitas terbaru</h2>
        {recent.length === 0 ? (
          <p className="py-6 text-center text-sm text-[#7183a0]">Belum ada aktivitas.</p>
        ) : (
          <ul className="space-y-4">
            {recent.map((a, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${a.tone}`}>
                  <Icon name={a.icon} className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{a.title}</p>
                  <p className="truncate text-xs text-[#7183a0]">{a.detail}</p>
                </div>
                <span className="shrink-0 text-xs text-[#7183a0]" title={formatDateTimeWib(a.at)}>
                  {timeAgo(a.at, now)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
