import Link from "next/link";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { getTenantSettings } from "@/lib/store";
import type { CurrentProfile } from "@/lib/auth";
import { formatRupiah } from "@/lib/billing";
import { formatClock } from "@/lib/format";

function Block({ title, message, href, label }: { title: string; message: string; href: string; label: string }) {
  return (
    <div className="mx-auto max-w-md rounded-2xl bg-white p-8 text-center shadow-[0_15px_50px_rgba(51,133,200,0.08)]">
      <p className="text-lg font-bold">{title}</p>
      <p className="mt-2 text-sm text-[#7183a0]">{message}</p>
      <Link
        href={href}
        className="mt-6 inline-block rounded-xl bg-[#3385c8] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#2875b4]"
      >
        {label}
      </Link>
    </div>
  );
}

/**
 * Pembungkus halaman Kasir: menahan penjualan kalau owner mewajibkan clock-in atau buka kasir,
 * dan menampilkan ringkasan kas yang sedang berjalan. Aturan yang sama juga dijaga di database.
 */
export default async function PosGate({
  profile,
  tenantId,
  shiftHref,
  attendanceHref,
  children,
}: {
  profile: CurrentProfile;
  tenantId: string;
  shiftHref: string;
  attendanceHref: string;
  children: ReactNode;
}) {
  const supabase = await createClient();
  const [settings, { data: shift }, { data: attendance }] = await Promise.all([
    getTenantSettings(supabase, tenantId),
    supabase
      .from("cash_shifts")
      .select("id, opened_at, opening_cash")
      .eq("user_id", profile.id)
      .is("closed_at", null)
      .maybeSingle(),
    profile.role === "cashier"
      ? supabase.from("attendance").select("id").eq("user_id", profile.id).is("clock_out", null).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  if (profile.role === "cashier" && settings.require_clock_in && !attendance) {
    return (
      <Block
        title="Clock-in dulu"
        message="Owner mewajibkan clock-in sebelum berjualan. Catat kehadiranmu di menu Absensi."
        href={attendanceHref}
        label="Ke Absensi"
      />
    );
  }

  if (settings.require_open_shift && !shift) {
    return (
      <Block
        title="Buka kasir dulu"
        message="Isi modal awal (uang di laci untuk kembalian) sebelum mulai berjualan."
        href={shiftHref}
        label="Buka kasir"
      />
    );
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white px-4 py-3 text-sm ring-1 ring-[#d6e2ef]">
        {shift ? (
          <span className="text-[#4a5f7d]">
            Kas dibuka sejak <strong>{formatClock(shift.opened_at as string)}</strong> · modal{" "}
            <strong>{formatRupiah(shift.opening_cash as number)}</strong>
          </span>
        ) : (
          <span className="text-[#7183a0]">Modal awal belum dicatat.</span>
        )}
        <Link href={shiftHref} className="font-semibold text-[#3385c8] hover:underline">
          {shift ? "Tutup kasir" : "Buka kasir"}
        </Link>
      </div>
      {children}
    </>
  );
}
