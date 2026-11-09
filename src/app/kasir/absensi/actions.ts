"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCashierContext } from "@/lib/tenant";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { formatClock } from "@/lib/format";
import { UUID_RE } from "@/lib/pos";

export type KioskResult = { ok?: boolean; message?: string; error?: string };

const PIN_RE = /^\d{4,6}$/;

type ToggleData = { action?: "in" | "out"; at?: string; name?: string; error?: string; remaining?: number };

function describe(data: ToggleData): KioskResult {
  const when = data.at ? formatClock(data.at) : "";
  return { ok: true, message: `${data.name ?? "Karyawan"}: ${data.action === "out" ? "Clock-out" : "Clock-in"} pukul ${when}` };
}

/** Absen karyawan mana pun di perangkat toko, dengan PIN milik karyawan itu. */
export async function kioskToggle(formData: FormData): Promise<KioskResult> {
  const ctx = await getCashierContext();
  if (ctx.blocked || !ctx.tenant) return { error: ctx.blocked ?? "Kasir belum bisa dipakai." };

  const employeeId = String(formData.get("employeeId") ?? "");
  const pin = String(formData.get("pin") ?? "").trim();
  if (!UUID_RE.test(employeeId)) return { error: "Karyawan tidak valid." };
  if (!PIN_RE.test(pin)) return { error: "PIN harus 4–6 angka." };

  const { data, error } = await supabaseAdmin.rpc("employee_kiosk_toggle", {
    p_tenant: ctx.tenant.id,
    p_employee: employeeId,
    p_pin: pin,
  });
  if (error) {
    if (error.message.includes("tenant_locked")) return { error: "Langganan toko sedang tidak aktif." };
    return { error: "Karyawan tidak ditemukan atau sudah nonaktif." };
  }

  const r = (data ?? {}) as ToggleData;
  if (r.error === "pin_wrong") return { error: `PIN salah. Sisa percobaan: ${r.remaining ?? 0}.` };
  if (r.error === "pin_locked") return { error: "PIN terkunci sementara karena salah terlalu sering. Coba lagi 5 menit lagi." };
  if (r.error === "pin_not_set") return { error: "PIN karyawan ini belum diatur. Minta owner mengaturnya." };

  revalidatePath("/kasir/absensi");
  return describe(r);
}

/** Karyawan yang punya akun login mengabsen dirinya sendiri tanpa PIN. */
export async function selfToggle() {
  const ctx = await getCashierContext();
  const back = (key: "ok" | "error", msg: string): never =>
    redirect(`/kasir/absensi?${key}=${encodeURIComponent(msg)}`);
  if (ctx.blocked) back("error", ctx.blocked);

  const { data, error } = await supabaseAdmin.rpc("employee_self_toggle", { p_user: ctx.profile.id });
  if (error) {
    back("error", error.message.includes("tenant_locked") ? "Langganan toko sedang tidak aktif." : "Akunmu belum terhubung ke data karyawan. Hubungi owner.");
  }

  revalidatePath("/kasir/absensi");
  back("ok", describe((data ?? {}) as ToggleData).message ?? "Tersimpan.");
}
