import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RECOVERY_COOKIE } from "@/lib/recovery";
import AuthShell from "@/components/AuthShell";
import ResetForm from "./reset-form";

export default async function ResetPasswordPage() {
  const recovered = (await cookies()).get(RECOVERY_COOKIE)?.value === "1";
  const {
    data: { user },
  } = await (await createClient()).auth.getUser();

  if (!recovered || !user) redirect("/forgot-password?error=link");

  return (
    <AuthShell title="Password Baru" subtitle="Buat password baru untuk akunmu.">
      <ResetForm />
    </AuthShell>
  );
}
