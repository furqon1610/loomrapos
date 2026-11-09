import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { logout } from "@/app/login/actions";
import { Icon } from "@/components/icons";
import SidebarNav, { type NavItem } from "@/components/superadmin/SidebarNav";

function Brand({ href }: { href: string }) {
  return (
    <Link href={href} className="flex items-center gap-3">
      <Image src="/logo.png" alt="" width={36} height={36} className="h-9 w-9" />
      <span className="text-lg font-bold text-[#102a4c]">
        Loomra<span className="text-[#3385c8]">POS</span>
      </span>
    </Link>
  );
}

function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        aria-label="Keluar"
        title="Keluar"
        className="rounded-lg p-2 text-[#7183a0] transition hover:bg-[#f0f6fc] hover:text-[#102a4c]"
      >
        <Icon name="logout" className="h-5 w-5" />
      </button>
    </form>
  );
}

/** Identitas toko (logo + nama) yang ditampilkan di pojok atas sebagai pengganti merek LoomraPOS. */
function StoreIdentity({
  href,
  name,
  logoUrl,
  size,
}: {
  href: string;
  name: string;
  logoUrl: string | null;
  size: "lg" | "sm";
}) {
  const box = size === "lg" ? "h-11 w-11 text-base" : "h-9 w-9 text-sm";
  return (
    <Link href={href} className="flex min-w-0 items-center gap-3">
      <span
        className={`flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#e8f3fc] font-bold uppercase text-[#2875b4] ${box}`}
      >
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="" className="h-full w-full bg-white object-contain" />
        ) : (
          name.charAt(0)
        )}
      </span>
      <span className="line-clamp-2 min-w-0 text-sm font-bold leading-5 text-[#102a4c]">{name}</span>
    </Link>
  );
}

export default function AppShell({
  homeHref,
  items,
  name,
  handle,
  identity,
  children,
}: {
  homeHref: string;
  items: NavItem[];
  name: string;
  handle: string;
  /** Kalau diisi, ditampilkan di pojok atas menggantikan merek LoomraPOS (dipakai area owner). */
  identity?: { name: string; logoUrl: string | null };
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f4f8fd] text-[#102a4c] md:flex">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-[#e3ebf5] bg-white p-4 md:flex print:hidden">
        <div className="mb-5 px-2 py-2">
          {identity ? (
            <StoreIdentity href={homeHref} name={identity.name} logoUrl={identity.logoUrl} size="lg" />
          ) : (
            <Brand href={homeHref} />
          )}
        </div>
        <SidebarNav variant="side" items={items} />

        <div className="mt-auto flex items-center gap-3 border-t border-[#eef2f7] pt-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8f3fc] text-sm font-bold uppercase text-[#2875b4]">
            {name.charAt(0)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{name}</p>
            <p className="truncate text-xs text-[#7183a0]">@{handle}</p>
          </div>
          <LogoutButton />
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Header (mobile) */}
        <header className="border-b border-[#e3ebf5] bg-white md:hidden print:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            {identity ? (
              <StoreIdentity href={homeHref} name={identity.name} logoUrl={identity.logoUrl} size="sm" />
            ) : (
              <Brand href={homeHref} />
            )}
            <LogoutButton />
          </div>
          <SidebarNav variant="top" items={items} />
        </header>

        <main className="mx-auto w-full max-w-7xl p-4 sm:p-6 print:max-w-none print:p-0">
          {children}
        </main>
      </div>
    </div>
  );
}
