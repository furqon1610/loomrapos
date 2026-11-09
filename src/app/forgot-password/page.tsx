import Link from "next/link";
import AuthShell from "@/components/AuthShell";
import ForgotForm from "./forgot-form";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <AuthShell
      title="Lupa Password"
      subtitle="Kami kirim tautan untuk membuat password baru ke email akunmu."
    >
      {error === "link" && (
        <p role="alert" className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          Tautan tidak valid atau sudah kedaluwarsa. Minta tautan baru di bawah.
        </p>
      )}

      <ForgotForm />

      <p className="mt-6 rounded-xl bg-[#f4f8fd] px-4 py-3 text-xs leading-5 text-[#7183a0]">
        Akun kasir tidak memakai email. Minta owner toko untuk mereset password lewat menu Karyawan.
      </p>

      <p className="mt-6 text-center text-sm text-[#7183a0]">
        Ingat password?{" "}
        <Link href="/login" className="font-semibold text-[#3385c8] hover:underline">
          Kembali ke login
        </Link>
      </p>
    </AuthShell>
  );
}
