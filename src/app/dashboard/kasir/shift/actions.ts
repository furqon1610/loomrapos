"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSaleContext } from "@/lib/tenant";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type ShiftState = { error?: string } | null;

const MAX_OPENING = 100_000_000;

function shiftPath(role: string) {
  return role === "owner" ? "/dashboard/kasir/shift" : "/kasir/shift";
}

function digits(value: FormDataEntryValue | null) {
  return String(value ?? "").replace(/\D/g, "");
}

export async function openShift(_prev: ShiftState, formData: FormData): Promise<ShiftState> {
  const ctx = await getSaleContext();
  if (!ctx.ok) return { error: ctx.reason };

  const opening = Number(digits(formData.get("opening")) || 0);
  const note = String(formData.get("note") ?? "").trim().slice(0, 200);
  if (!Number.isInteger(opening) || opening < 0 || opening > MAX_OPENING) {
    return { error: "Modal awal harus 0 – 100.000.000." };
  }

  const { error } = await supabaseAdmin.rpc("open_shift", {
    p_user: ctx.profile.id,
    p_opening: opening,
    p_note: note || null,
  });
  if (error) {
    if (error.message.includes("shift_already_open")) return { error: "Kasir sudah dibuka. Muat ulang halaman." };
    if (error.message.includes("tenant_locked")) return { error: "Langganan tidak aktif." };
    return { error: "Gagal membuka kasir. Coba lagi." };
  }

  revalidatePath("/dashboard/kasir", "layout");
  revalidatePath("/kasir", "layout");
  redirect(shiftPath(ctx.profile.role));
}

export async function closeShift(_prev: ShiftState, formData: FormData): Promise<ShiftState> {
  const ctx = await getSaleContext();
  if (!ctx.ok) return { error: ctx.reason };

  const raw = digits(formData.get("counted"));
  if (!raw) return { error: "Isi jumlah uang tunai yang ada di laci." };
  const counted = Number(raw);
  const note = String(formData.get("note") ?? "").trim().slice(0, 200);
  if (!Number.isInteger(counted) || counted < 0 || counted > 2_000_000_000) {
    return { error: "Jumlah uang tidak valid." };
  }

  const { data, error } = await supabaseAdmin.rpc("close_shift", {
    p_user: ctx.profile.id,
    p_counted: counted,
    p_note: note || null,
  });
  if (error || !data) {
    if (error?.message.includes("shift_not_open")) return { error: "Tidak ada kasir yang sedang dibuka." };
    return { error: "Gagal menutup kasir. Coba lagi." };
  }

  revalidatePath("/dashboard/kasir", "layout");
  revalidatePath("/kasir", "layout");
  revalidatePath("/dashboard/laporan/shift");
  redirect(`${shiftPath(ctx.profile.role)}?done=${(data as { id: string }).id}`);
}
