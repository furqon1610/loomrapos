import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { b64u, encryptPayload, vapidAuthHeader } from "@/lib/webpush-crypto";

export type PushPayload = { title: string; body: string; url: string; tag?: string };

type Config = { publicKey: string; privateKey: string; subject: string };

function config(): Config | null {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  return publicKey && privateKey && subject ? { publicKey, privateKey, subject } : null;
}

export function isPushConfigured() {
  return config() !== null;
}

type Sub = { id: string; endpoint: string; p256dh: string; auth: string };

async function sendOne(sub: Sub, payload: PushPayload, cfg: Config): Promise<"ok" | "gone" | "failed"> {
  try {
    const body = encryptPayload(
      Buffer.from(JSON.stringify(payload)),
      b64u.dec(sub.p256dh),
      b64u.dec(sub.auth),
    );
    const res = await fetch(sub.endpoint, {
      method: "POST",
      headers: {
        "Content-Encoding": "aes128gcm",
        "Content-Type": "application/octet-stream",
        TTL: "86400",
        Urgency: "high",
        Authorization: vapidAuthHeader(sub.endpoint, cfg.publicKey, cfg.privateKey, cfg.subject),
      },
      body: new Uint8Array(body),
      signal: AbortSignal.timeout(8000),
    });
    // 404/410: langganan sudah tidak berlaku (notifikasi dimatikan atau browser dihapus)
    if (res.status === 404 || res.status === 410) return "gone";
    return res.ok ? "ok" : "failed";
  } catch {
    return "failed";
  }
}

/**
 * Kirim notifikasi ke semua perangkat superadmin. Tidak pernah melempar error:
 * kegagalan notifikasi tidak boleh membatalkan proses utama (pembayaran, pendaftaran).
 */
export async function notifySuperadmins(payload: PushPayload): Promise<{ sent: number; failed: number }> {
  const cfg = config();
  if (!cfg) return { sent: 0, failed: 0 };

  try {
    const { data: admins } = await supabaseAdmin.from("profiles").select("id").eq("role", "superadmin");
    const ids = (admins ?? []).map((a) => a.id as string);
    if (ids.length === 0) return { sent: 0, failed: 0 };

    const { data: subs } = await supabaseAdmin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .in("user_id", ids);

    const results = await Promise.all(
      ((subs ?? []) as Sub[]).map(async (s) => ({ id: s.id, result: await sendOne(s, payload, cfg) })),
    );

    const gone = results.filter((r) => r.result === "gone").map((r) => r.id);
    if (gone.length > 0) await supabaseAdmin.from("push_subscriptions").delete().in("id", gone);

    return {
      sent: results.filter((r) => r.result === "ok").length,
      failed: results.filter((r) => r.result !== "ok").length,
    };
  } catch {
    return { sent: 0, failed: 0 };
  }
}
