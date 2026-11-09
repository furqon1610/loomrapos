import { Icon } from "@/components/icons";
import { PACKAGE_LABEL, type Access, type TenantRow } from "@/lib/billing";
import { formatShortDate } from "@/lib/format";

export type TenantListRow = { tenant: TenantRow; access: Access; owner: string };

function statusBadge(access: Access) {
  switch (access.state) {
    case "trial":
      return { label: "Trial", cls: "bg-amber-50 text-amber-700" };
    case "active":
      return { label: "Aktif", cls: "bg-emerald-50 text-emerald-700" };
    case "locked":
      return { label: "Dikunci", cls: "bg-red-50 text-red-600" };
    case "expired":
      return access.viaPending
        ? { label: "Menunggu", cls: "bg-amber-50 text-amber-700" }
        : { label: "Berakhir", cls: "bg-red-50 text-red-600" };
  }
}

export default function TenantTable({
  rows,
  showBusinessType = false,
  compact = false,
}: {
  rows: TenantListRow[];
  showBusinessType?: boolean;
  /** Mode ringkas untuk dashboard: kolom No, Pemilik, dan Bergabung baru tampil di layar lebar (xl). */
  compact?: boolean;
}) {
  const wide = compact ? "hidden xl:table-cell" : "";
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8f3fc] text-[#3385c8]">
          <Icon name="store" className="h-7 w-7" />
        </span>
        <p className="font-semibold text-[#102a4c]">Belum ada tenant</p>
        <p className="max-w-xs text-sm text-[#7183a0]">
          Tenant akan muncul di sini setelah owner mendaftar dan membuat tokonya.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className={`w-full text-left text-sm ${compact ? "" : "min-w-[620px]"}`}>
        <thead className="bg-[#f4f8fd] text-xs font-semibold text-[#5b6f8e]">
          <tr>
            <th className={`px-3 py-3 ${wide}`}>No</th>
            <th className="px-3 py-3">Nama Toko</th>
            <th className={`px-3 py-3 ${wide}`}>Pemilik</th>
            <th className="px-3 py-3">Paket</th>
            <th className="px-3 py-3">Status</th>
            <th className={`px-3 py-3 ${wide}`}>Bergabung</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#eef2f7]">
          {rows.map(({ tenant, access, owner }, i) => {
            const badge = statusBadge(access);
            return (
              <tr key={tenant.id}>
                <td className={`px-3 py-3 text-[#7183a0] ${wide}`}>{i + 1}</td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e8f3fc] text-[#3385c8]">
                      <Icon name="store" className="h-[18px] w-[18px]" />
                    </span>
                    <div>
                      <p className="font-semibold text-[#102a4c]">{tenant.name}</p>
                      {compact && <p className="text-xs text-[#7183a0] xl:hidden">{owner}</p>}
                      {showBusinessType && (
                        <p className="text-xs text-[#7183a0]">{tenant.business_type ?? "-"}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className={`px-3 py-3 text-[#4a5f7d] ${wide}`}>{owner}</td>
                <td className="px-3 py-3">
                  <span
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                      tenant.package === "pro"
                        ? "bg-purple-50 text-purple-700"
                        : "bg-blue-50 text-blue-700"
                    }`}
                  >
                    {PACKAGE_LABEL[tenant.package]}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${badge.cls}`}>
                    {badge.label}
                  </span>
                </td>
                <td className={`px-3 py-3 text-[#7183a0] ${wide}`}>
                  {formatShortDate(tenant.created_at)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
