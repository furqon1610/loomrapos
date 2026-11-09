import { getCashierContext } from "@/lib/tenant";
import ShiftPageContent from "@/components/shift/ShiftPageContent";

export default async function CashierShiftPage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string }>;
}) {
  const { profile, tenant, blocked } = await getCashierContext();
  if (blocked || !tenant) return null;
  const { done } = await searchParams;
  return <ShiftPageContent userId={profile.id} doneId={done} />;
}
