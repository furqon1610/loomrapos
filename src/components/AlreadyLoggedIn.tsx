import Link from "next/link";
import { logout } from "@/app/login/actions";
import type { Role } from "@/lib/auth";

const ROLE_LABEL: Record<Role, string> = {
  superadmin: "Superadmin",
  owner: "Owner",
  cashier: "Kasir",
};

/**
 * Ditampilkan di halaman login/daftar saat browser ini sudah punya sesi aktif.
 * Sesi disimpan di cookie yang dipakai bersama semua tab di browser yang sama,
 * jadi untuk pindah akun pengguna harus keluar dulu.
 */
export default function AlreadyLoggedIn({
  name,
  username,
  role,
  homeHref,
}: {
  name: string;
  username: string;
  role: Role;
  homeHref: string;
}) {
  return (
    <div className="space-y-5 text-center">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#e8f3fc] text-2xl font-bold uppercase text-[#2875b4]">
        {name.charAt(0)}
      </span>

      <div>
        <p className="text-lg font-bold text-[#102a4c]">{name}</p>
        <p className="text-sm text-[#7183a0]">
          @{username} · {ROLE_LABEL[role]}
        </p>
      </div>

      <Link
        href={homeHref}
        className="block rounded-xl bg-[#3385c8] py-4 font-semibold text-white shadow-lg shadow-[#3385c8]/20 transition hover:bg-[#2875b4]"
      >
        Lanjutkan ke aplikasi
      </Link>

      <form action={logout}>
        <button
          type="submit"
          className="w-full rounded-xl border border-[#d6e2ef] bg-white py-4 font-semibold text-[#4a5f7d] transition hover:bg-[#f7fbff]"
        >
          Keluar &amp; ganti akun
        </button>
      </form>

      <p className="text-xs leading-5 text-[#7183a0]">
        Sesi login dipakai bersama oleh semua tab di browser ini. Untuk memakai dua akun sekaligus,
        buka jendela Incognito atau browser lain.
      </p>
    </div>
  );
}
