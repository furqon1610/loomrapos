import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { PACKAGE_LABEL, formatRupiah, type Package } from "@/lib/billing";
import {
  formatLongDate,
  formatTimeWib,
  startOfMonthWIB,
  timeAgo,
} from "@/lib/format";
import { loadTenantRows } from "@/lib/superadmin-data";
import { Icon, type IconName } from "@/components/icons";
import TenantTable from "@/components/superadmin/TenantTable";
import DonutChart from "@/components/superadmin/DonutChart";

const card = "rounded-2xl bg-white shadow-[0_15px_50px_rgba(51,133,200,0.08)]";

type PaymentRow = {
  tenant_id: string;
  package: Package;
  amount: number;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  reviewed_at: string | null;
};

type Activity = {
  at: Date;
  title: string;
  detail: string;
  icon: IconName;
  tone: string;
};

function StatCard({
  icon,
  tone,
  label,
  value,
  note,
}: {
  icon: IconName;
  tone: string;
  label: string;
  value: number;
  note: string;
}) {
  return (
    <div className={`${card} p-4`}>
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
        <Icon name={icon} className="h-5 w-5" />
      </span>
      <p className="mt-3 text-sm font-semibold text-[#102a4c]">{label}</p>
      <p className="mt-0.5 text-2xl font-bold text-[#102a4c]">{value}</p>
      <p className="mt-1 text-[11px] leading-4 text-[#7183a0]">{note}</p>
    </div>
  );
}

function HeroIllustration() {
  return (
    <svg viewBox="0 0 220 120" className="h-28 w-auto" aria-hidden="true">
      <rect x="40" y="14" width="150" height="88" rx="10" fill="#dceeff" />
      <rect x="48" y="22" width="134" height="72" rx="6" fill="#ffffff" />
      <rect x="62" y="34" width="34" height="34" rx="8" fill="#e8f3fc" />
      <path d="M71 44l2-4h14l2 4M71 44v2a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0v-2M73 52v10h14V52" fill="none" stroke="#3385c8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="110" y="56" width="10" height="16" rx="2" fill="#b9dcf7" />
      <rect x="124" y="46" width="10" height="26" rx="2" fill="#7fbcea" />
      <rect x="138" y="38" width="10" height="34" rx="2" fill="#3385c8" />
      <rect x="28" y="102" width="174" height="8" rx="4" fill="#b9dcf7" />
      <path d="M196 102c-6-14-4-30 6-42 4 12 4 28-6 42z" fill="#8cc4ee" />
      <path d="M188 102c-10-8-14-22-10-34 8 8 12 22 10 34z" fill="#b9dcf7" />
    </svg>
  );
}

export default async function SuperadminDashboardPage() {
  const profile = await requireRole(["superadmin"]);
  const now = new Date();
  const monthStart = startOfMonthWIB(now);

  const [rows, { data: paymentData }] = await Promise.all([
    loadTenantRows(now),
    supabaseAdmin
      .from("subscription_payments")
      .select("tenant_id, package, amount, status, created_at, reviewed_at")
      .order("created_at", { ascending: false })
      .limit(30),
  ]);
  const payments = (paymentData ?? []) as PaymentRow[];

  // ---- Angka ringkasan ----
  const total = rows.length;
  const newThisMonth = rows.filter((r) => new Date(r.tenant.created_at) >= monthStart).length;
  const activeRows = rows.filter((r) => r.access.state === "active");
  const trialRows = rows.filter((r) => r.access.state === "trial");
  const proRows = activeRows.filter((r) => r.tenant.package === "pro");
  const basicRows = activeRows.filter((r) => r.tenant.package === "basic");
  const inactiveCount = total - activeRows.length - trialRows.length;
  const trialEndingSoon = trialRows.filter((r) => r.access.daysLeft <= 7).length;

  const approvedThisMonth = payments.filter(
    (p) => p.status === "approved" && p.reviewed_at && new Date(p.reviewed_at) >= monthStart,
  );
  const proApprovedThisMonth = approvedThisMonth.filter((p) => p.package === "pro").length;

  // ---- Aktivitas terbaru (dari data yang sudah ada) ----
  const nameById = new Map(rows.map((r) => [r.tenant.id, r.tenant.name]));
  const activities: Activity[] = [];

  for (const r of rows.slice(0, 10)) {
    activities.push({
      at: new Date(r.tenant.created_at),
      title: "Tenant baru terdaftar",
      detail: r.tenant.name,
      icon: "plus",
      tone: "bg-emerald-50 text-emerald-600",
    });
  }
  for (const p of payments) {
    const name = nameById.get(p.tenant_id) ?? "Tenant";
    activities.push({
      at: new Date(p.created_at),
      title: "Pengajuan pembayaran",
      detail: `${name} · ${PACKAGE_LABEL[p.package]} ${formatRupiah(p.amount)}`,
      icon: "upload",
      tone: "bg-amber-50 text-amber-600",
    });
    if (p.reviewed_at && p.status === "approved") {
      activities.push({
        at: new Date(p.reviewed_at),
        title: "Pembayaran diverifikasi",
        detail: `${name} (${formatRupiah(p.amount)})`,
        icon: "check",
        tone: "bg-blue-50 text-blue-600",
      });
    }
    if (p.reviewed_at && p.status === "rejected") {
      activities.push({
        at: new Date(p.reviewed_at),
        title: "Pembayaran ditolak",
        detail: `${name} (${formatRupiah(p.amount)})`,
        icon: "x",
        tone: "bg-red-50 text-red-600",
      });
    }
  }
  activities.sort((a, b) => b.at.getTime() - a.at.getTime());
  const recent = activities.slice(0, 5);

  const segments = [
    { label: "Pro", value: proRows.length, color: "#7c3aed" },
    { label: "Basic", value: basicRows.length, color: "#3385c8" },
    { label: "Trial", value: trialRows.length, color: "#f59e0b" },
    { label: "Berakhir", value: inactiveCount, color: "#cbd5e1" },
  ];
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            Selamat datang, {profile.fullName ?? profile.username} 👋
          </h1>
          <p className="mt-2 text-sm text-[#7183a0]">
            Kelola semua tenant, pantau aktivitas, dan atur billing dengan mudah.
          </p>
        </div>
        <div className="hidden shrink-0 items-center gap-4 lg:flex">
          <div className="flex items-start gap-2 text-sm text-[#4a5f7d]">
            <Icon name="calendar" className="mt-0.5 h-5 w-5" />
            <div>
              <p className="font-semibold">{formatLongDate(now)}</p>
              <p className="text-[#7183a0]">{formatTimeWib(now)}</p>
            </div>
          </div>
          <div className="hidden xl:block">
            <HeroIllustration />
          </div>
        </div>
      </div>

      {/* Kartu ringkasan */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard
          icon="store"
          tone="bg-blue-50 text-[#3385c8]"
          label="Total Tenant"
          value={total}
          note={`+${newThisMonth} baru bulan ini`}
        />
        <StatCard
          icon="users"
          tone="bg-emerald-50 text-emerald-600"
          label="Tenant Aktif"
          value={activeRows.length}
          note={`${approvedThisMonth.length} disetujui bulan ini`}
        />
        <StatCard
          icon="clock"
          tone="bg-purple-50 text-purple-600"
          label="Dalam Trial"
          value={trialRows.length}
          note={`${trialEndingSoon} berakhir ≤ 7 hari`}
        />
        <StatCard
          icon="crown"
          tone="bg-amber-50 text-amber-500"
          label="Tenant Pro"
          value={proRows.length}
          note={`${proApprovedThisMonth} bayar Pro bulan ini`}
        />
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* Ringkasan tenant */}
        <section className={`${card} p-5`}>
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Ringkasan Tenant</h2>
              <p className="mt-1 text-sm text-[#7183a0]">
                Tenant terbaru yang terdaftar di sistem LoomraPOS.
              </p>
            </div>
            <Link
              href="/superadmin/tenants"
              className="flex items-center gap-2 rounded-full bg-[#e8f3fc] px-4 py-2 text-xs font-semibold text-[#2875b4] transition hover:bg-[#d8ebfa]"
            >
              Lihat Semua
              <Icon name="arrowRight" className="h-3.5 w-3.5" />
            </Link>
          </div>
          <TenantTable rows={rows.slice(0, 7)} compact />
        </section>

        <div className="space-y-5">
          {/* Distribusi paket */}
          <section className={`${card} p-5`}>
            <h2 className="text-lg font-bold">Distribusi Paket</h2>
            <p className="mt-1 text-sm text-[#7183a0]">
              Persentase tenant berdasarkan paket yang digunakan.
            </p>
            <div className="mt-4 flex items-center justify-between gap-4">
              <DonutChart segments={segments} total={total} />
              <ul className="min-w-0 flex-1 space-y-2.5 text-sm">
                {segments.map((s) => (
                  <li key={s.label} className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="flex-1 text-[#4a5f7d]">{s.label}</span>
                    <span className="text-xs text-[#7183a0]">
                      {s.value} ({pct(s.value)}%)
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Aktivitas terbaru */}
          <section className={`${card} p-5`}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Aktivitas Terbaru</h2>
              <Link href="/superadmin/billing" className="text-xs font-semibold text-[#3385c8] hover:underline">
                Lihat Billing
              </Link>
            </div>
            {recent.length === 0 ? (
              <p className="py-6 text-center text-sm text-[#7183a0]">Belum ada aktivitas.</p>
            ) : (
              <ul className="space-y-4">
                {recent.map((a, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${a.tone}`}
                    >
                      <Icon name={a.icon} className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{a.title}</p>
                      <p className="truncate text-xs text-[#7183a0]">{a.detail}</p>
                    </div>
                    <span className="shrink-0 text-xs text-[#7183a0]">{timeAgo(a.at, now)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
