import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Role = "superadmin" | "owner" | "cashier";

const ROLE_HOME: Record<Role, string> = {
  superadmin: "/superadmin",
  owner: "/dashboard",
  cashier: "/kasir",
};

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && value in ROLE_HOME;
}

/** Halaman tujuan setelah login. Null kalau role tidak dikenal. */
export function homeForRole(role: unknown): string | null {
  return isRole(role) ? ROLE_HOME[role] : null;
}

export type CurrentProfile = {
  id: string;
  username: string;
  fullName: string | null;
  role: Role;
  tenantId: string | null;
};

/** Profil user yang sedang login (divalidasi ke server Supabase), atau null. Di-cache per request. */
export const getCurrentProfile = cache(async (): Promise<CurrentProfile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, full_name, role, tenant_id, active")
    .eq("id", user.id)
    .maybeSingle();

  // Akun yang dinonaktifkan owner (kasir) tidak boleh masuk walau sesinya masih ada.
  if (!profile || !isRole(profile.role) || profile.active === false) return null;
  return {
    id: profile.id as string,
    username: profile.username as string,
    fullName: (profile.full_name as string | null) ?? null,
    role: profile.role,
    tenantId: (profile.tenant_id as string | null) ?? null,
  };
});

/** Pakai di setiap halaman terproteksi. Belum login -> /login, salah role -> beranda role-nya. */
export async function requireRole(allowed: Role[]) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!allowed.includes(profile.role)) redirect(ROLE_HOME[profile.role]);
  return profile;
}
