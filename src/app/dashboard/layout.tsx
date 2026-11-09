import type { ReactNode } from "react";
import { getOwnerContext } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";
import { tenantLogoUrl } from "@/lib/store";
import { formatDate } from "@/lib/billing";
import AppShell from "@/components/AppShell";
import SubscriptionBanner from "@/components/owner/SubscriptionBanner";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const { profile, tenant, access } = await getOwnerContext();

  let banner: { tone: "info" | "warn"; text: string; linkLabel: string } | null = null;
  if (access.state === "trial") {
    banner = {
      tone: access.daysLeft <= 3 ? "warn" : "info",
      text: `Masa percobaan: sisa ${access.daysLeft} hari (sampai ${formatDate(access.endsAt!)}). Pilih paket sebelum berakhir supaya akun tetap aktif.`,
      linkLabel: "Lihat langganan",
    };
  } else if (access.state === "active" && access.daysLeft <= 7) {
    banner = {
      tone: "warn",
      text: `Langganan berakhir ${access.daysLeft} hari lagi (${formatDate(access.endsAt!)}).`,
      linkLabel: "Perpanjang",
    };
  } else if (access.state === "expired" && access.viaPending) {
    banner = {
      tone: "warn",
      text: "Masa aktif berakhir. Pembayaranmu sedang diverifikasi, akun tetap bisa dipakai sementara.",
      linkLabel: "Lihat status",
    };
  }

  return (
    <AppShell
      homeHref="/dashboard"
      name={profile.fullName ?? profile.username}
      handle={profile.username}
      identity={{
        name: tenant.name,
        logoUrl: tenantLogoUrl(await createClient(), tenant.logo_path),
      }}
      items={[
        // Paket Pro: owner mengelola dan memantau, penjualan dilakukan lewat akun kasir.
        ...(tenant.package === "pro" ? [] : [{ href: "/dashboard/kasir", label: "Kasir", icon: "cart" as const }]),
        { href: "/dashboard/produk", label: "Produk", icon: "box" },
        { href: "/dashboard/laporan", label: "Laporan", icon: "chart" },
        {
          href: "/dashboard/karyawan",
          label: "Karyawan",
          icon: "users",
          tag: tenant.package === "pro" ? undefined : "Pro",
        },
        { href: "/dashboard/langganan", label: "Langganan", icon: "card" },
        { href: "/dashboard/pengaturan", label: "Pengaturan", icon: "sliders" },
      ]}
    >
      {banner && <SubscriptionBanner {...banner} />}
      {children}
    </AppShell>
  );
}
