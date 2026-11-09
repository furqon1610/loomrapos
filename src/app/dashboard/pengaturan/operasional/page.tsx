import { requireActiveOwner } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";
import { getTenantSettings } from "@/lib/store";
import OperationalForm from "./operational-form";

export default async function OperationalSettingsPage() {
  const { tenant } = await requireActiveOwner();
  const settings = await getTenantSettings(await createClient(), tenant.id);

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Operasional</h1>
        <p className="mt-1 text-sm text-[#7183a0]">Aturan yang berlaku saat berjualan.</p>
      </div>
      <OperationalForm
        initial={{ requireOpenShift: settings.require_open_shift, requireClockIn: settings.require_clock_in }}
        isPro={tenant.package === "pro"}
      />
    </div>
  );
}
