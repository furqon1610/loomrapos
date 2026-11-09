import type { ReactNode } from "react";
import { requireRole } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import AppShell from "@/components/AppShell";

export default async function SuperadminLayout({ children }: { children: ReactNode }) {
  const profile = await requireRole(["superadmin"]);

  const { count } = await supabaseAdmin
    .from("subscription_payments")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  return (
    <AppShell
      homeHref="/superadmin"
      name={profile.fullName ?? profile.username}
      handle={profile.username}
      items={[
        { href: "/superadmin", label: "Dashboard", icon: "home", exact: true },
        { href: "/superadmin/tenants", label: "Tenant", icon: "store" },
        { href: "/superadmin/billing", label: "Billing", icon: "card", badge: count ?? 0 },
        { href: "/superadmin/settings", label: "Settings", icon: "sliders" },
      ]}
    >
      {children}
    </AppShell>
  );
}
