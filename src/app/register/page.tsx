import Link from "next/link";
import { getCurrentProfile, homeForRole } from "@/lib/auth";
import AuthShell from "@/components/AuthShell";
import AlreadyLoggedIn from "@/components/AlreadyLoggedIn";
import RegisterForm from "./register-form";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan } = await searchParams;
  const profile = await getCurrentProfile();
  const home = profile ? homeForRole(profile.role) : null;
  if (profile && home) {
    return (
      <AuthShell title="Kamu sudah login" subtitle="Keluar dulu kalau ingin membuat akun baru.">
        <AlreadyLoggedIn
          name={profile.fullName ?? profile.username}
          username={profile.username}
          role={profile.role}
          homeHref={home}
        />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Buat Akun Baru"
      subtitle="Coba gratis 14 hari. Paket Basic atau Pro dipilih di langkah berikutnya."
    >
      <RegisterForm plan={plan === "pro" ? "pro" : "basic"} />
      <p className="mt-7 text-center text-sm text-[#7183a0]">
        Sudah punya akun?{" "}
        <Link href="/login" className="font-semibold text-[#3385c8] hover:underline">
          Masuk
        </Link>
      </p>
    </AuthShell>
  );
}
