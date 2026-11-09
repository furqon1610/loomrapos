import { logout } from "@/app/login/actions";

export default function RolePlaceholder({
  title,
  username,
  description,
}: {
  title: string;
  username: string;
  description?: string;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f7fbff] px-5 text-center text-[#102a4c]">
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="max-w-md text-[#7183a0]">
        {description ?? (
          <>
            Login berhasil sebagai <strong>{username}</strong>. Halaman ini masih placeholder.
          </>
        )}
      </p>
      <form action={logout}>
        <button
          type="submit"
          className="rounded-xl border border-[#d6e2ef] bg-white px-6 py-3 text-sm font-semibold text-[#102a4c] transition hover:bg-[#f7fbff]"
        >
          Keluar
        </button>
      </form>
    </main>
  );
}
