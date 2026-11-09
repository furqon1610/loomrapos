"use server";

import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { b64u } from "@/lib/webpush-crypto";
import { notifySuperadmins } from "@/lib/webpush";

type SubscriptionInput = { endpoint: string; p256dh: string; auth: string };

export async function savePushSubscription(input: SubscriptionInput): Promise<{ error?: string }> {
  const admin = await requireRole(["superadmin"]);

  let endpoint: URL;
  try {
    endpoint = new URL(input.endpoint);
  } catch {
    return { error: "Alamat langganan tidak valid." };
  }
  if (endpoint.protocol !== "https:" || input.endpoint.length > 1000) {
    return { error: "Alamat langganan tidak valid." };
  }

  // Kunci dari browser: p256dh = titik P-256 tidak terkompresi (65 byte), auth = 16 byte
  const p256dh = b64u.dec(String(input.p256dh ?? ""));
  const auth = b64u.dec(String(input.auth ?? ""));
  if (p256dh.length !== 65 || p256dh[0] !== 4 || auth.length !== 16) {
    return { error: "Kunci langganan tidak valid." };
  }

  const supabase = await createClient();
  await supabase.from("push_subscriptions").delete().eq("endpoint", input.endpoint);
  const { error } = await supabase.from("push_subscriptions").insert({
    user_id: admin.id,
    endpoint: input.endpoint,
    p256dh: input.p256dh,
    auth: input.auth,
  });
  if (error) return { error: "Gagal menyimpan langganan notifikasi." };
  return {};
}

export async function removePushSubscription(endpoint: string): Promise<void> {
  await requireRole(["superadmin"]);
  const supabase = await createClient();
  await supabase.from("push_subscriptions").delete().eq("endpoint", String(endpoint));
}

export async function sendTestPush(): Promise<{ ok: boolean; message: string }> {
  await requireRole(["superadmin"]);
  const { sent, failed } = await notifySuperadmins({
    title: "Tes notifikasi LoomraPOS",
    body: "Kalau kamu melihat ini, notifikasi sudah aktif.",
    url: "/superadmin/billing",
    tag: "test",
  });
  if (sent > 0) return { ok: true, message: `Terkirim ke ${sent} perangkat.` };
  return {
    ok: false,
    message:
      failed > 0
        ? "Pengiriman gagal. Matikan lalu aktifkan lagi notifikasinya."
        : "Belum ada perangkat yang terdaftar atau kunci VAPID belum diatur.",
  };
}
