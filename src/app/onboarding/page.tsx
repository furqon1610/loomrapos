import { redirect } from "next/navigation";
import { getCurrentProfile, homeForRole } from "@/lib/auth";
import AuthShell from "@/components/AuthShell";
import OnboardingForm from "./onboarding-form";
import { BUSINESS_TYPES } from "@/lib/business-types";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan } = await searchParams;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "owner") redirect(homeForRole(profile.role) ?? "/login");
  if (profile.tenantId) redirect("/dashboard");

  return (
    <AuthShell
      title="Buat Toko Anda"
      subtitle="Pilih paket dan isi data toko. Coba gratis 14 hari, bayar setelah trial berakhir."
    >
      <OnboardingForm
        businessTypes={BUSINESS_TYPES}
        defaultPackage={plan === "pro" ? "pro" : "basic"}
      />
    </AuthShell>
  );
}
