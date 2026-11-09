"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type ForgotState = { done?: boolean; error?: string } | null;

/**
 * Selalu menjawab sama (kecuali terlalu sering meminta), apa pun hasil pencarian akun,
 * supaya orang luar tidak bisa menebak username atau email mana yang terdaftar.
 */
export async function requestPasswordReset(
  _prev: ForgotState,
  formData: FormData,
): Promise<ForgotState> {
  const input = String(formData.get("identifier") ?? "").trim().toLowerCase();
  if (!input || input.length > 254) return { error: "Isi username atau email." };

  const query = supabaseAdmin.from("profiles").select("id, role");
  const { data: profile } = input.includes("@")
    ? await query.eq("email", input).maybeSingle()
    : await query.eq("username", input).maybeSingle();

  // Akun kasir memakai email teknis yang tidak bisa menerima pesan: reset lewat owner.
  if (!profile || profile.role === "cashier") return { done: true };

  const { data: authData } = await supabaseAdmin.auth.admin.getUserById(profile.id as string);
  const email = authData?.user?.email;
  if (!email) return { done: true };

  const h = await headers();
  const origin =
    h.get("origin") ?? `${h.get("x-forwarded-proto") ?? "http"}://${h.get("x-forwarded-host") ?? h.get("host")}`;

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm`,
  });

  if (error) {
    if (error.status === 429 || /rate limit|too many/i.test(error.message)) {
      return { error: "Terlalu sering meminta. Coba lagi beberapa menit lagi." };
    }
    // Pengiriman gagal (mis. SMTP belum diatur): catat di log server, pengguna tetap melihat jawaban umum.
    console.error("[reset-password] gagal mengirim email:", error.message);
  }
  return { done: true };
}
