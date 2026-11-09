"use server";

import { revalidatePath } from "next/cache";
import { getOwnerContext } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type AccountState = { error?: string; success?: string; at?: number } | null;

const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;

export async function updateProfile(
  _prev: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const { profile } = await getOwnerContext();

  const fullName = String(formData.get("fullName") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim().toLowerCase();

  if (fullName.length < 2 || fullName.length > 80) return { error: "Nama wajib diisi (2–80 karakter)." };
  if (!USERNAME_RE.test(username)) {
    return { error: "Username hanya boleh huruf, angka, dan underscore (tanpa spasi), 3–20 karakter." };
  }

  // Tabel profiles tidak bisa diubah langsung oleh pengguna (RLS); hanya baris milik sendiri lewat server.
  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ full_name: fullName, username })
    .eq("id", profile.id);

  if (error) {
    return { error: error.code === "23505" ? "Username sudah dipakai." : "Gagal menyimpan. Coba lagi." };
  }

  revalidatePath("/dashboard", "layout");
  return { success: "Profil tersimpan.", at: Date.now() };
}

export async function changePassword(
  _prev: AccountState,
  formData: FormData,
): Promise<AccountState> {
  await getOwnerContext();

  const current = String(formData.get("current_password") ?? "");
  const next = String(formData.get("new_password") ?? "");
  const confirm = String(formData.get("confirm_password") ?? "");

  if (!current) return { error: "Isi password saat ini." };
  if (next.length < 8 || next.length > 72) return { error: "Password baru minimal 8 karakter." };
  if (next !== confirm) return { error: "Konfirmasi password tidak sama." };
  if (next === current) return { error: "Password baru harus berbeda dari yang lama." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { error: "Sesi tidak valid. Login ulang." };

  // Pastikan yang mengganti memang pemilik akun (bukan sekadar sesi yang tertinggal terbuka).
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: current,
  });
  if (verifyError) return { error: "Password saat ini salah." };

  const { error } = await supabase.auth.updateUser({ password: next });
  if (error) {
    if (error.code === "same_password") return { error: "Password baru harus berbeda dari yang lama." };
    if (error.code === "weak_password") return { error: "Password terlalu lemah." };
    return { error: "Gagal mengganti password. Coba lagi." };
  }

  return { success: "Password berhasil diganti.", at: Date.now() };
}
