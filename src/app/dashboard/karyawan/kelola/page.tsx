import { redirect } from "next/navigation";

// Halaman "Kelola kasir" digabung ke Daftar karyawan. Berkas ini boleh dihapus.
export default function ManageEmployeesPage() {
  redirect("/dashboard/karyawan/daftar");
}
