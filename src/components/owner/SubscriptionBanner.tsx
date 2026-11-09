"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Pengingat langganan di atas halaman. Disembunyikan di halaman Langganan sendiri dan saat cetak. */
export default function SubscriptionBanner({
  tone,
  text,
  linkLabel,
}: {
  tone: "info" | "warn";
  text: string;
  linkLabel: string;
}) {
  const pathname = usePathname();
  if (pathname.startsWith("/dashboard/langganan")) return null;

  return (
    <div
      className={`mb-5 flex flex-wrap items-center justify-between gap-2 rounded-xl px-4 py-3 text-sm print:hidden ${
        tone === "warn" ? "bg-amber-50 text-amber-800" : "bg-[#e8f3fc] text-[#2875b4]"
      }`}
    >
      <span>{text}</span>
      <Link href="/dashboard/langganan" className="font-semibold underline underline-offset-2">
        {linkLabel}
      </Link>
    </div>
  );
}
