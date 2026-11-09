import { getOwnerContext } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";
import AccountForms from "./account-forms";

export default async function AccountSettingsPage() {
  // Tidak memakai requireActiveOwner: akun yang terkunci tetap boleh mengelola akunnya.
  const { profile } = await getOwnerContext();
  const {
    data: { user },
  } = await (await createClient()).auth.getUser();

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Akun</h1>
        <p className="mt-1 text-sm text-[#7183a0]">Ubah nama, username, dan password.</p>
      </div>
      <AccountForms
        fullName={profile.fullName ?? ""}
        username={profile.username}
        email={user?.email ?? "-"}
      />
    </div>
  );
}
