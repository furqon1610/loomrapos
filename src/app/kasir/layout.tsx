import type { ReactNode } from "react";
import { getCashierContext } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";
import { tenantLogoUrl } from "@/lib/store";
import AppShell from "@/components/AppShell";

export default async function CashierLayout({ children }: { children: ReactNode }) {
  const { profile, tenant, blocked } = await getCashierContext();

  return (
    <AppShell
      homeHref="/kasir"
      name={profile.fullName ?? profile.username}
      handle={profile.username}
      identity={
        tenant
          ? { name: tenant.name, logoUrl: tenantLogoUrl(await createClient(), tenant.logo_path) }
          : undefined
      }
      items={
        blocked
          ? []
          : [
              { href: "/kasir", label: "Kasir", icon: "cart", exact: true },
              { href: "/kasir/absensi", label: "Absensi", icon: "clock" },
              { href: "/kasir/riwayat", label: "Riwayat", icon: "receipt" },
              { href: "/kasir/printer", label: "Printer", icon: "printer" },
            ]
      }
    >
      {blocked ? (
        <div className="mx-auto max-w-md rounded-2xl bg-white p-8 text-center shadow-[0_15px_50px_rgba(51,133,200,0.08)]">
          <p className="text-lg font-bold">Kasir belum bisa dipakai</p>
          <p className="mt-2 text-sm text-[#7183a0]">{blocked}</p>
        </div>
      ) : (
        children
      )}
    </AppShell>
  );
}
