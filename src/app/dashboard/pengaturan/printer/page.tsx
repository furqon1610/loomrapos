import { requireActiveOwner } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";
import { getReceiptSettings } from "@/lib/store";
import PrinterPanel from "./printer-panel";

export default async function PrinterSettingsPage() {
  const { tenant } = await requireActiveOwner();
  const settings = await getReceiptSettings(await createClient(), tenant.id);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Printer Bluetooth</h1>
        <p className="mt-1 text-sm text-[#7183a0]">
          Sambungkan printer struk supaya bisa mencetak langsung dari Kasir.
        </p>
      </div>
      <PrinterPanel paperWidth={settings.paper_width} />
    </div>
  );
}
