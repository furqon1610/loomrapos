"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/dashboard/karyawan/monitoring", label: "Monitoring" },
  { href: "/dashboard/karyawan/daftar", label: "Karyawan" },
  { href: "/dashboard/karyawan/absensi", label: "Absensi" },
  { href: "/dashboard/karyawan/laporan", label: "Laporan" },
];

export default function EmployeeTabs() {
  const pathname = usePathname();

  return (
    <nav className="mb-5 flex gap-1 overflow-x-auto rounded-xl bg-white p-1 ring-1 ring-[#d6e2ef]">
      {TABS.map((t) => {
        const active = pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              active ? "bg-[#3385c8] text-white" : "text-[#4a5f7d] hover:bg-[#f0f6fc]"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
