import Image from "next/image";
import Link from "next/link";
import { getCurrentProfile, homeForRole } from "@/lib/auth";
import AuthShell from "@/components/AuthShell";
import AlreadyLoggedIn from "@/components/AlreadyLoggedIn";
import LoginForm from "./login-form";

export default async function LoginPage() {
  // Browser ini sudah punya sesi: tampilkan siapa yang login, jangan diam-diam dialihkan.
  const profile = await getCurrentProfile();
  const home = profile ? homeForRole(profile.role) : null;
  if (profile && home) {
    return (
      <AuthShell title="Kamu sudah login" subtitle="Lanjutkan, atau keluar untuk memakai akun lain.">
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
    <main className="relative min-h-screen overflow-hidden bg-[#f7fbff] px-4 py-8 sm:px-6">

      {/* Background decoration */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#dceeff] opacity-70 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 h-80 w-80 rounded-full bg-[#dceeff] opacity-70 blur-2xl" />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-lg flex-col items-center justify-center">

        {/* Logo */}
        <div className="mb-7 text-center">
          <Image
            src="/logo.png"
            alt="LoomraPOS Logo"
            width={90}
            height={90}
            className="mx-auto h-auto w-20 sm:w-24"
            priority
          />

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#102a4c] sm:text-4xl">
            Loomra<span className="text-[#3385c8]">POS</span>
          </h1>

          <h2 className="mt-7 text-2xl font-bold text-[#102a4c] sm:text-3xl">
            Selamat Datang Kembali 👋
          </h2>

          <p className="mt-3 text-sm leading-6 text-[#7183a0] sm:text-base">
            Masuk ke akun Anda untuk melanjutkan
            <br className="hidden sm:block" />
            ke dashboard LoomraPOS.
          </p>
        </div>

        {/* Login Card */}
        <div className="w-full rounded-2xl bg-white p-6 shadow-[0_15px_50px_rgba(51,133,200,0.10)] sm:p-8">

          {/* Login Form */}
          <LoginForm />

          {/* Divider */}
          <div className="my-7 flex items-center gap-4">
            <div className="h-px flex-1 bg-[#dce5ef]" />

            <span className="text-sm text-[#8b9bb0]">
              atau
            </span>

            <div className="h-px flex-1 bg-[#dce5ef]" />
          </div>

          {/* Google Login */}
          <button
            type="button"
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#d6e2ef] bg-white py-4 font-medium text-[#102a4c] transition hover:bg-[#f7fbff] active:scale-[0.99]"
          >
            <span className="text-xl font-bold">G</span>
            Login dengan Google
          </button>

          {/* Register */}
          <div className="mt-8 text-center">
            <Link
              href="/register"
              className="font-semibold text-[#3385c8] hover:underline"
            >
              ＋ Buat akun baru
            </Link>

            <p className="mt-2 text-xs leading-5 text-[#8b9bb0] sm:text-sm">
              Daftar sekarang dan mulai gunakan LoomraPOS
              <br />
              untuk usaha Anda.
            </p>
          </div>

        </div>

        {/* Footer */}
        <p className="mt-7 text-center text-xs text-[#8b9bb0]">
          LoomraPOS&nbsp;&nbsp;•&nbsp;&nbsp;Solusi Kasir Modern untuk Usaha Anda
        </p>

      </div>
    </main>
  );
}