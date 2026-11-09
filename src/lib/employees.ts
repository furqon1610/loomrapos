import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type EmployeeRow = {
  user_id: string;
  name: string;
  username: string;
  role: "owner" | "cashier";
  active: boolean;
  tx_count: number;
  total: number;
};

/** Transaksi dan penjualan per orang (owner dan kasir) pada satu periode, dihitung di database. */
export async function getEmployeeReport(tenantId: string, from: Date, to: Date): Promise<EmployeeRow[]> {
  const { data } = await supabaseAdmin.rpc("employee_report", {
    p_tenant: tenantId,
    p_from: from.toISOString(),
    p_to: to.toISOString(),
  });
  return (data ?? []) as EmployeeRow[];
}

/** Kasir yang masih aktif atau punya transaksi, ditambah owner kalau dia ikut bertransaksi. */
export function visibleEmployees(rows: EmployeeRow[]) {
  return rows.filter((r) => (r.role === "cashier" ? r.active || r.tx_count > 0 : r.tx_count > 0));
}
