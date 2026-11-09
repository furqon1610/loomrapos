import Link from "next/link";
import { requireActiveOwner } from "@/lib/tenant";
import { Icon, type IconName } from "@/components/icons";

function Item({
  href,
  icon,
  title,
  description,
}: {
  href?: string;
  icon: IconName;
  title: string;
  description: string;
}) {
  const body = (
    <>
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#e8f3fc] text-[#3385c8]">
        <Icon name={icon} className="h-6 w-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{title}</span>
        <span className="block text-sm text-[#7183a0]">{description}</span>
      </span>
      {href ? (
        <Icon name="arrowRight" className="h-5 w-5 text-[#7183a0]" />
      ) : (
        <span className="rounded-full bg-[#f0f6fc] px-3 py-1 text-xs font-semibold text-[#7183a0]">Segera</span>
      )}
    </>
  );
  const cls =
    "flex items-center gap-4 rounded-2xl bg-white p-5 shadow-[0_15px_50px_rgba(51,133,200,0.08)]";

  return href ? (
    <Link href={href} className={`${cls} transition hover:-translate-y-0.5`}>
      {body}
    </Link>
  ) : (
    <div className={`${cls} opacity-70`}>{body}</div>
  );
}

export default async function SettingsPage() {
  await requireActiveOwner();

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Pengaturan</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Item
          href="/dashboard/pengaturan/struk"
          icon="receipt"
          title="Struk"
          description="Logo, informasi toko, isi struk, dan footer."
        />
        <Item
          href="/dashboard/pengaturan/operasional"
          icon="clock"
          title="Operasional"
          description="Wajib buka kasir (modal awal) dan wajib clock-in."
        />
        <Item
          href="/dashboard/pengaturan/akun"
          icon="users"
          title="Akun"
          description="Ubah nama, username, dan password."
        />
        <Item
          href="/dashboard/pengaturan/printer"
          icon="printer"
          title="Printer Bluetooth"
          description="Sambungkan printer untuk mencetak struk langsung."
        />
      </div>
    </div>
  );
}
