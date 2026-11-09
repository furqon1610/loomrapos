"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RECOVERY_COOKIE } from "@/lib/recovery";

export async function confirmRecovery(formData: FormData) {
  const tokenHash = String(formData.get("token_hash") ?? "");
  if (!/^[\w-]{10,200}$/.test(tokenHash)) redirect("/forgot-password?error=link");

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type: "recovery", token_hash: tokenHash });
  if (error) redirect("/forgot-password?error=link");

  // Penanda singkat bahwa sesi ini berasal dari tautan reset (bukan login biasa).
  (await cookies()).set(RECOVERY_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 15 * 60,
    path: "/",
  });
  redirect("/reset-password");
}
