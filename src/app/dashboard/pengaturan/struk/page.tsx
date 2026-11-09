import { requireActiveOwner } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";
import { getReceiptSettings, tenantLogoUrl } from "@/lib/store";
import ReceiptSettingsForm from "./receipt-settings-form";

export default async function ReceiptSettingsPage() {
  const { profile, tenant } = await requireActiveOwner();
  const supabase = await createClient();
  const settings = await getReceiptSettings(supabase, tenant.id);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Struk</h1>
        <p className="mt-1 text-sm text-[#7183a0]">
          Atur logo, informasi toko, dan isi struk. Perubahan terlihat langsung di pratinjau.
        </p>
      </div>

      <ReceiptSettingsForm
        store={{
          name: tenant.name,
          address: tenant.address ?? "",
          phone: tenant.phone ?? "",
          extraInfo: tenant.extra_info ?? "",
        }}
        logoUrl={tenantLogoUrl(supabase, tenant.logo_path)}
        settings={settings}
        cashierName={profile.fullName ?? profile.username}
        sampleDate={new Date().toISOString()}
      />
    </div>
  );
}
