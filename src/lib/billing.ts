export type Package = "basic" | "pro";

export type TenantRow = {
  id: string;
  name: string;
  address: string | null;
  business_type: string | null;
  phone: string | null;
  logo_path: string | null;
  extra_info: string | null;
  package: Package;
  status: "trial" | "active" | "locked";
  trial_ends_at: string;
  active_until: string | null;
  created_at: string;
};

export const PRICES: Record<Package, number> = { basic: 99000, pro: 299000 };
export const PACKAGE_LABEL: Record<Package, string> = { basic: "Basic", pro: "Pro" };

const DAY_MS = 86_400_000;

export function formatRupiah(amount: number) {
  return "Rp" + new Intl.NumberFormat("id-ID").format(amount);
}

export function formatDate(value: string | Date) {
  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
}

export type Access = {
  ok: boolean;
  state: "trial" | "active" | "expired" | "locked";
  daysLeft: number;
  endsAt: Date | null;
  /** Akun masih boleh dipakai hanya karena ada pembayaran yang menunggu verifikasi. */
  viaPending: boolean;
};

/** Akses dihitung dari tanggal, jadi tidak perlu cron untuk mengunci akun. */
export function getTenantAccess(
  tenant: TenantRow,
  hasPending: boolean,
  now: Date = new Date(),
): Access {
  if (tenant.status === "locked") {
    return { ok: false, state: "locked", daysLeft: 0, endsAt: null, viaPending: false };
  }

  const endIso = tenant.status === "trial" ? tenant.trial_ends_at : tenant.active_until;
  const end = endIso ? new Date(endIso) : null;

  if (end && end > now) {
    return {
      ok: true,
      state: tenant.status,
      daysLeft: Math.ceil((end.getTime() - now.getTime()) / DAY_MS),
      endsAt: end,
      viaPending: false,
    };
  }

  return { ok: hasPending, state: "expired", daysLeft: 0, endsAt: end, viaPending: hasPending };
}

function isPaidActive(tenant: TenantRow, now: Date) {
  return (
    tenant.status === "active" &&
    !!tenant.active_until &&
    new Date(tenant.active_until) > now
  );
}

/** Paket yang boleh dibayar sekarang. Downgrade di tengah periode belum tersedia. */
export function packageOptions(tenant: TenantRow, now: Date = new Date()): Package[] {
  if (tenant.package === "pro" && isPaidActive(tenant, now)) return ["pro"];
  return ["basic", "pro"];
}

/**
 * Nominal yang harus dibayar.
 * Upgrade dari Basic yang sudah dibayar: Rp299.000 dikurangi kredit sisa hari Basic.
 * Selain itu: harga penuh (termasuk upgrade saat masih trial).
 * Logika masa aktif baru ada di fungsi SQL approve_subscription_payment.
 */
export function computePayment(
  tenant: TenantRow,
  target: Package,
  now: Date = new Date(),
) {
  const remainingMs = tenant.active_until
    ? new Date(tenant.active_until).getTime() - now.getTime()
    : 0;
  const paidBasic = tenant.package === "basic" && tenant.status === "active" && remainingMs > 0;

  if (target === "pro" && paidBasic) {
    const remainingDays = Math.ceil(remainingMs / DAY_MS);
    const credit = Math.round((PRICES.basic * remainingDays) / 30 / 100) * 100;
    return { amount: Math.max(PRICES.pro - credit, 1), credit, remainingDays };
  }

  return { amount: PRICES[target], credit: 0, remainingDays: 0 };
}
