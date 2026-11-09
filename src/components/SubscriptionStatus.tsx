import { formatDate, PACKAGE_LABEL, type Access, type TenantRow } from "@/lib/billing";

export default function SubscriptionStatus({
  tenant,
  access,
}: {
  tenant: Pick<TenantRow, "package">;
  access: Access;
}) {
  let tone = "bg-emerald-50 text-emerald-700";
  let text = "";

  switch (access.state) {
    case "trial":
      tone = "bg-[#e8f3fc] text-[#2875b4]";
      text = `Trial — sisa ${access.daysLeft} hari (sampai ${formatDate(access.endsAt!)})`;
      break;
    case "active":
      text = `Aktif — sampai ${formatDate(access.endsAt!)} (${access.daysLeft} hari lagi)`;
      break;
    case "locked":
      tone = "bg-red-50 text-red-600";
      text = "Dikunci oleh admin";
      break;
    case "expired":
      if (access.viaPending) {
        tone = "bg-amber-50 text-amber-700";
        text = "Masa aktif berakhir — menunggu verifikasi pembayaran";
      } else {
        tone = "bg-red-50 text-red-600";
        text = "Masa aktif berakhir — akun terkunci";
      }
      break;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="rounded-full bg-[#102a4c] px-3 py-1 text-xs font-semibold text-white">
        {PACKAGE_LABEL[tenant.package]}
      </span>
      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>{text}</span>
    </div>
  );
}
