import { redirect } from "next/navigation";
import { requireActiveOwner } from "@/lib/tenant";

// Basic: langsung ke Kasir. Pro: langsung ke Monitoring.
// Akun terkunci diarahkan ke halaman Langganan oleh requireActiveOwner.
export default async function DashboardPage() {
  const { tenant } = await requireActiveOwner();
  redirect(tenant.package === "pro" ? "/dashboard/karyawan/monitoring" : "/dashboard/kasir");
}
