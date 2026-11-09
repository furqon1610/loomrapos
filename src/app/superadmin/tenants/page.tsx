import { loadTenantRows } from "@/lib/superadmin-data";
import TenantTable from "@/components/superadmin/TenantTable";

export default async function TenantsPage() {
  const rows = await loadTenantRows();
  const pending = rows.filter((r) => r.access.viaPending).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Semua Tenant</h1>
          <p className="mt-1 text-sm text-[#7183a0]">
            Daftar semua tenant yang terdaftar di LoomraPOS.
          </p>
        </div>
        <p className="text-sm text-[#7183a0]">
          {rows.length} tenant{pending > 0 ? ` · ${pending} menunggu verifikasi` : ""}
        </p>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-[0_15px_50px_rgba(51,133,200,0.08)]">
        <TenantTable rows={rows} showBusinessType />
      </div>
    </div>
  );
}
