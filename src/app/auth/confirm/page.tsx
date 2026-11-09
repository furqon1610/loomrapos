import Link from "next/link";
import AuthShell from "@/components/AuthShell";
import { confirmRecovery } from "./actions";

// Sengaja memakai tombol, bukan memproses tautan langsung: pemindai keamanan email sering
// membuka tautan lebih dulu dan akan menghanguskan tautan sekali pakai itu.
export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string; type?: string }>;
}) {
  const { token_hash, type } = await searchParams;

  if (!token_hash || type !== "recovery") {
    return (
      <AuthShell title="Tautan tidak valid" subtitle="Tautan ini tidak lengkap atau sudah tidak berlaku.">
        <Link
          href="/forgot-password"
          className="block rounded-xl bg-[#3385c8] py-4 text-center font-semibold text-white transition hover:bg-[#2875b4]"
        >
          Minta tautan baru
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Buat Password Baru" subtitle="Tekan tombol di bawah untuk melanjutkan.">
      <form action={confirmRecovery}>
        <input type="hidden" name="token_hash" value={token_hash} />
        <button
          type="submit"
          className="w-full rounded-xl bg-[#3385c8] py-4 font-semibold text-white shadow-lg shadow-[#3385c8]/20 transition hover:bg-[#2875b4]"
        >
          Lanjutkan
        </button>
      </form>
    </AuthShell>
  );
}
