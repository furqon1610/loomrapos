import { requireActiveOwner } from "@/lib/tenant";
import ShiftPageContent from "@/components/shift/ShiftPageContent";

export default async function OwnerShiftPage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string }>;
}) {
  const { profile } = await requireActiveOwner();
  const { done } = await searchParams;
  return <ShiftPageContent userId={profile.id} doneId={done} />;
}
