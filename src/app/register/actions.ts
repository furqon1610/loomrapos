"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type RegisterState = {
  error: string;
  values: { fullName: string; username: string; email: string };
} | null;

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function register(
  _prevState: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const values = { fullName, username, email };
  const fail = (error: string): RegisterState => ({ error, values });

  if (fullName.length < 2 || fullName.length > 80) {
    return fail("Nama wajib diisi (2–80 karakter).");
  }
  if (!USERNAME_RE.test(username)) {
    return fail("Username hanya boleh huruf, angka, dan underscore (tanpa spasi), 3–20 karakter.");
  }
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return fail("Format email tidak valid.");
  }
  if (password.length < 8 || password.length > 72) {
    return fail("Password minimal 8 karakter.");
  }

  const { data: existing } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  if (existing) return fail("Username sudah dipakai.");

  // Akun Auth dibuat lewat server. Verifikasi email belum dipakai (perlu SMTP sendiri).
  const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (createError || !created.user) {
    if (createError?.code === "email_exists" || createError?.code === "user_already_exists") {
      return fail("Email sudah terdaftar.");
    }
    if (createError?.code === "weak_password") return fail("Password terlalu lemah.");
    return fail("Gagal membuat akun. Coba lagi.");
  }

  const { error: profileError } = await supabaseAdmin.from("profiles").insert({
    id: created.user.id,
    username,
    full_name: fullName,
    email,
    role: "owner",
  });

  if (profileError) {
    // Batalkan akun Auth supaya tidak ada akun yatim tanpa profil.
    await supabaseAdmin.auth.admin.deleteUser(created.user.id);
    if (profileError.code === "23505") return fail("Username sudah dipakai.");
    return fail("Gagal menyimpan profil. Coba lagi.");
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) redirect("/login");

  redirect(formData.get("plan") === "pro" ? "/onboarding?plan=pro" : "/onboarding");
}
