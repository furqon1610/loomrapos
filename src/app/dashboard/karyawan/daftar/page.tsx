import Link from "next/link";
import { requireProOwner } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";
import { formatClock, rangeFor, todayWIB } from "@/lib/format";
import { Icon } from "@/components/icons";
import { AddEmployeeForm, Collapsible } from "../employee-forms";

const card = "rounded-2xl bg-white p-5 shadow-[0_15px_50px_rgba(51,133,200,0.08)]";

type Emp = {
  id: string;
  user_id: string | null;
  name: string;
  job_title: string | null;
  phone: string | null;
  active: boolean;
  has_pin: boolean;
};
type Session = { employee_id: string; clock_in: string; clock_out: string | null };

export default async function EmployeeListPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { tenant } = await requireProOwner();
  const { error } = await searchParams;
  const supabase = await createClient();
  const today = rangeFor("day", todayWIB());

  const [{ data: empData }, { data: todaySessions }, { data: openSessions }] = await Promise.all([
    supabase
      .from("employees")
      .select("id, user_id, name, job_title, phone, active, has_pin")
      .eq("tenant_id", tenant.id)
      .order("active", { ascending: false })
      .order("name"),
    supabase
      .from("attendance")
      .select("employee_id, clock_in, clock_out")
      .eq("tenant_id", tenant.id)
      .gte("clock_in", today.from.toISOString())
      .lt("clock_in", today.to.toISOString()),
    supabase.from("attendance").select("employee_id, clock_in, clock_out").eq("tenant_id", tenant.id).is("clock_out", null),
  ]);

  const employees = (empData ?? []) as Emp[];
  const accountIds = employees.map((e) => e.user_id).filter((v): v is string => !!v);
  const { data: accounts } = accountIds.length
    ? await supabase.from("profiles").select("id, username, active").in("id", accountIds)
    : { data: [] };
  const accountOf = new Map((accounts ?? []).map((a) => [a.id as string, a as { id: string; username: string; active: boolean }]));

  const sessions = [...((todaySessions ?? []) as Session[]), ...((openSessions ?? []) as Session[])];
  const statusOf = (id: string) => {
    const mine = sessions.filter((s) => s.employee_id === id);
    const open = mine.find((s) => !s.clock_out);
    if (open) return { label: `Bekerja ${formatClock(open.clock_in)}`, tone: "bg-emerald-50 text-emerald-700" };
    if (mine.length > 0) return { label: "Sudah pulang", tone: "bg-[#e8f3fc] text-[#2875b4]" };
    return { label: "Belum hadir", tone: "bg-[#f0f2f5] text-[#7183a0]" };
  };

  const activeCount = employees.filter((e) => e.active).length;
  const accountCount = employees.filter((e) => e.user_id && accountOf.get(e.user_id)?.active).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Karyawan</h1>
          <p className="mt-1 text-sm text-[#7183a0]">
            {activeCount} karyawan aktif · {accountCount} dari 3 akun login kasir terpakai
          </p>
        </div>
        <Collapsible label="+ Tambah karyawan">
          <div className="w-full max-w-xl">
            <AddEmployeeForm />
          </div>
        </Collapsible>
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="rounded-xl bg-[#f4f8fd] px-4 py-3 text-xs leading-5 text-[#4a5f7d]">
        Semua karyawan bisa absen dengan <strong>PIN</strong> di perangkat toko, tanpa perlu akun login. Akun login
        (maksimal 3 orang) hanya untuk yang memakai Kasir.
      </div>

      <section className={card}>
        {employees.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8f3fc] text-[#3385c8]">
              <Icon name="users" className="h-7 w-7" />
            </span>
            <p className="font-semibold">Belum ada karyawan</p>
            <p className="max-w-xs text-sm text-[#7183a0]">Tambahkan karyawan tokomu, lalu atur PIN absensi mereka.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-[#f4f8fd] text-xs font-semibold text-[#5b6f8e]">
                <tr>
                  <th className="px-3 py-3">Nama</th>
                  <th className="px-3 py-3">Hari ini</th>
                  <th className="px-3 py-3">Akun login</th>
                  <th className="px-3 py-3">PIN</th>
                  <th className="px-3 py-3 text-right">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eef2f7]">
                {employees.map((e) => {
                  const st = statusOf(e.id);
                  const acc = e.user_id ? accountOf.get(e.user_id) : undefined;
                  return (
                    <tr key={e.id} className={e.active ? "" : "opacity-60"}>
                      <td className="px-3 py-3">
                        <p className="font-semibold">{e.name}</p>
                        <p className="text-xs text-[#7183a0]">
                          {e.job_title ?? "—"}
                          {!e.active ? " · Nonaktif" : ""}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        {e.active ? (
                          <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${st.tone}`}>{st.label}</span>
                        ) : (
                          <span className="text-[#7183a0]">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-[#4a5f7d]">
                        {acc ? (
                          <>
                            @{acc.username}
                            {!acc.active && <span className="ml-1 text-xs text-[#7183a0]">(nonaktif)</span>}
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-3 py-3">
                        {e.has_pin ? (
                          <span className="text-emerald-700">✓ Ada</span>
                        ) : (
                          <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                            Belum diatur
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <Link
                          href={`/dashboard/karyawan/daftar/${e.id}`}
                          className="font-semibold text-[#3385c8] hover:underline"
                        >
                          Buka →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
