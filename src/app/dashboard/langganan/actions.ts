"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { getOwnerContext } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { PACKAGE_LABEL, computePayment, formatRupiah, packageOptions } from "@/lib/billing";
import { notifySuperadmins } from "@/lib/webpush";

export type PaymentState = { error?: string; success?: boolean } | null;

const MAX_BYTES = 5 * 1024 * 1024;
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function submitPayment(
  _prevState: PaymentState,
  formData: FormData,
): Promise<PaymentState> {
  const { profile, tenant, access, hasPending } = await getOwnerContext();

  if (access.state === "locked") {
    return { error: "Akun dikunci oleh admin. Hubungi admin LoomraPOS." };
  }
  if (hasPending) {
    return { error: "Masih ada pembayaran yang menunggu verifikasi." };
  }

  const target = formData.get("package");
  if ((target !== "basic" && target !== "pro") || !packageOptions(tenant).includes(target)) {
    return { error: "Paket tidak valid." };
  }

  const proof = formData.get("proof");
  if (!(proof instanceof File) || proof.size === 0) {
    return { error: "Bukti pembayaran wajib diunggah." };
  }
  const ext = EXT[proof.type];
  if (!ext) return { error: "Bukti harus berupa gambar JPG, PNG, atau WebP." };
  if (proof.size > MAX_BYTES) return { error: "Ukuran bukti maksimal 5 MB." };

  // Nominal selalu dihitung ulang di server, tidak dipercaya dari form.
  const { amount } = computePayment(tenant, target);

  const supabase = await createClient();
  const path = `${tenant.id}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("payment-proofs")
    .upload(path, proof, { contentType: proof.type });
  if (uploadError) return { error: "Gagal mengunggah bukti. Coba lagi." };

  const { error: insertError } = await supabase.from("subscription_payments").insert({
    tenant_id: tenant.id,
    package: target,
    amount,
    proof_path: path,
    submitted_by: profile.id,
  });

  if (insertError) {
    await supabaseAdmin.storage.from("payment-proofs").remove([path]);
    return {
      error:
        insertError.code === "23505"
          ? "Masih ada pembayaran yang menunggu verifikasi."
          : "Gagal menyimpan pembayaran. Coba lagi.",
    };
  }

  // Beri tahu superadmin setelah respons dikirim, supaya owner tidak menunggu.
  after(() =>
    notifySuperadmins({
      title: "Pengajuan pembayaran baru",
      body: `${tenant.name} · ${PACKAGE_LABEL[target]} ${formatRupiah(amount)}`,
      url: "/superadmin/billing",
      tag: "billing",
    }),
  );

  revalidatePath("/dashboard/langganan");
  return { success: true };
}
