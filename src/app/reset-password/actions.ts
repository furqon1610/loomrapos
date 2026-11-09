"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, homeForRole } from "@/lib/auth";
import { RECOVERY_COOKIE } from "@/lib/recovery";

export type ResetState = { error?: string } | null;

export async function resetPassword(_prev: ResetState, formData: FormData): Promise<ResetState> {
  const jar = await cookies();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Hanya sesi yang baru dibuka lewat tautan reset yang boleh mengganti password tanpa password lama.
  if (jar.get(RECOVERY_COOKIE)?.value !== "1" || !user) redirect("/forgot-password?error=link");

  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 8 || password.length > 72) return { error: "Password minimal 8 karakter." };
  if (password !== confirm) return { error: "Konfirmasi password tidak sama." };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    if (error.code === "same_password") return { error: "Password baru harus berbeda dari yang lama." };
    if (error.code === "weak_password") return { error: "Password terlalu lemah." };
    return { error: "Gagal mengganti password. Minta tautan baru." };
  }

  jar.delete(RECOVERY_COOKIE);
  // Akhiri sesi di perangkat lain; sesi ini tetap login.
  await supabase.auth.signOut({ scope: "others" });

  const profile = await getCurrentProfile();
  redirect((profile && homeForRole(profile.role)) || "/login");
}
