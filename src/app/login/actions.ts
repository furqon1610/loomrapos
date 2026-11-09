"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { homeForRole } from "@/lib/auth";

export type LoginState = { error: string; username: string } | null;

// Pesan sama untuk username salah maupun password salah,
// supaya username tidak bisa ditebak satu per satu.
const INVALID_CREDENTIALS = "Username atau password salah.";
const INACTIVE_ACCOUNT = "Akun ini dinonaktifkan. Hubungi owner toko.";

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return { error: "Username dan password wajib diisi.", username };
  }

  // 1. Cari akun dari username (server-only, lewat secret key).
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id, role, active")
    .eq("username", username)
    .maybeSingle();

  if (!profile) return { error: INVALID_CREDENTIALS, username };

  // 2. Supabase Auth login pakai email, jadi ambil email milik akun itu.
  const { data: authData, error: authLookupError } =
    await supabaseAdmin.auth.admin.getUserById(profile.id);
  const email = authData?.user?.email;

  if (authLookupError || !email) return { error: INVALID_CREDENTIALS, username };

  // 3. Verifikasi password dan buat sesi (cookie diset lewat server client).
  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    // Akun kasir yang dinonaktifkan owner diblokir di Supabase Auth.
    if (/banned/i.test(signInError.message)) {
      return { error: INACTIVE_ACCOUNT, username };
    }
    return { error: INVALID_CREDENTIALS, username };
  }

  if (profile.active === false) {
    await supabase.auth.signOut();
    return { error: INACTIVE_ACCOUNT, username };
  }

  // 4. Arahkan sesuai role. Role tidak dikenal -> batalkan sesi.
  const home = homeForRole(profile.role);
  if (!home) {
    await supabase.auth.signOut();
    return {
      error: "Akun belum memiliki role yang valid. Hubungi admin.",
      username,
    };
  }

  redirect(home);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
