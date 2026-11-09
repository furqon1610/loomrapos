import Link from "next/link";
import { redirect } from "next/navigation";
import { requireActiveOwner } from "@/lib/tenant";
import { Icon } from "@/components/icons";

export default async function EmployeesPage() {
  const { tenant } = await requireActiveOwner();

  // Paket Pro langsung ke Monitoring.
  if (tenant.package === "pro") redirect("/dashboard/karyawan/monitoring");

  // Paket Basic: ajakan upgrade, bukan halaman kosong atau 404.
  return (
    <div className="mx-auto max-w-xl space-y-5">
      <h1 className="text-2xl font-bold">Karyawan</h1>
      <div className="rounded-2xl bg-white p-8 text-center shadow-[0_15px_50px_rgba(51,133,200,0.08)]">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8f3fc] text-[#3385c8]">
          <Icon name="users" className="h-7 w-7" />
        </span>
        <p className="mt-4 text-lg font-bold">Fitur khusus paket Pro</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-[#7183a0]">
          Buat hingga 3 akun kasir dengan username dan password sendiri, catat absensi mereka, dan pantau transaksi
          serta penjualan tiap karyawan.
        </p>
        <Link
          href="/dashboard/langganan"
          className="mt-6 inline-block rounded-xl bg-[#3385c8] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#2875b4]"
        >
          Upgrade ke Pro
        </Link>
      </div>
    </div>
  );
}
