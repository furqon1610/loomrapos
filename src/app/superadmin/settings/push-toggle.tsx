"use client";

import { useEffect, useState } from "react";
import { removePushSubscription, savePushSubscription, sendTestPush } from "./push-actions";

type Status = "loading" | "insecure" | "unsupported" | "denied" | "off" | "on";

function toArrayBuffer(base64url: string) {
  const pad = "=".repeat((4 - (base64url.length % 4)) % 4);
  const raw = atob((base64url + pad).replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes.buffer;
}

function supported() {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

const btn =
  "rounded-xl px-5 py-3 text-sm font-semibold transition disabled:opacity-60";

export default function PushToggle({
  publicKey,
  configured,
}: {
  publicKey: string;
  configured: boolean;
}) {
  const [status, setStatus] = useState<Status>("loading");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const [origin, setOrigin] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let next: Status = "off";
      try {
        if (!window.isSecureContext) next = "insecure";
        else if (!supported()) next = "unsupported";
        else if (Notification.permission === "denied") next = "denied";
        else {
          const reg = await navigator.serviceWorker.getRegistration("/sw.js");
          const sub = await reg?.pushManager.getSubscription();
          next = sub ? "on" : "off";
        }
      } catch {
        next = "off"; // pemeriksaan gagal: tetap tampilkan tombol, jangan macet di "Memeriksa"
      }
      if (!cancelled) {
        setOrigin(window.location.origin);
        setStatus(next);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function enable() {
    setBusy(true);
    setMessage(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "off");
        return;
      }
      await navigator.serviceWorker.register("/sw.js");
      const reg = await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: toArrayBuffer(publicKey),
        }));

      const json = sub.toJSON();
      const res = await savePushSubscription({
        endpoint: json.endpoint ?? "",
        p256dh: json.keys?.p256dh ?? "",
        auth: json.keys?.auth ?? "",
      });
      if (res.error) {
        await sub.unsubscribe();
        setMessage({ ok: false, text: res.error });
        return;
      }
      setStatus("on");
      setMessage({ ok: true, text: "Notifikasi aktif di perangkat ini." });
    } catch {
      setMessage({ ok: false, text: "Gagal mengaktifkan notifikasi. Coba lagi." });
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setMessage(null);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/sw.js");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await removePushSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
      setStatus("off");
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    setBusy(true);
    setMessage(null);
    const res = await sendTestPush();
    setMessage({ ok: res.ok, text: res.message });
    setBusy(false);
  }

  if (!configured) {
    return (
      <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Kunci VAPID belum diatur. Jalankan <code className="font-mono">node scripts/generate-vapid.mjs</code>, salin
        hasilnya ke <code className="font-mono">.env.local</code>, lalu mulai ulang server.
      </p>
    );
  }
  if (status === "loading") return <p className="text-sm text-[#7183a0]">Memeriksa...</p>;
  if (status === "insecure") {
    return (
      <div className="space-y-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <p>
          Notifikasi hanya bisa dipakai lewat alamat <strong>https</strong> (atau <strong>localhost</strong> di
          komputer). Sekarang kamu membuka lewat <code className="font-mono">{origin}</code>.
        </p>
        <p>
          Untuk menguji di HP: buka situs yang sudah di-deploy (https), atau pakai tunnel seperti Cloudflare Tunnel,
          atau di Chrome Android buka <code className="font-mono">chrome://flags/#unsafely-treat-insecure-origin-as-secure</code>,
          isi dengan alamat ini, aktifkan, lalu mulai ulang Chrome.
        </p>
      </div>
    );
  }
  if (status === "unsupported") {
    return (
      <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Browser ini tidak mendukung notifikasi. Di iPhone/iPad, tambahkan aplikasi ke Layar Utama dulu (iOS 16.4 ke
        atas). Di Android dan komputer, pakai Chrome.
      </p>
    );
  }
  if (status === "denied") {
    return (
      <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
        Notifikasi diblokir untuk situs ini. Buka pengaturan situs di browser, ubah izin Notifikasi menjadi Izinkan,
        lalu muat ulang halaman.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        {status === "on" ? (
          <>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              Aktif di perangkat ini
            </span>
            <button
              type="button"
              onClick={test}
              disabled={busy}
              className={`${btn} border border-[#d6e2ef] bg-white text-[#2875b4] hover:bg-[#e8f3fc]`}
            >
              Kirim tes
            </button>
            <button
              type="button"
              onClick={disable}
              disabled={busy}
              className={`${btn} border border-[#d6e2ef] bg-white text-[#4a5f7d] hover:bg-[#f7fbff]`}
            >
              Matikan
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={enable}
            disabled={busy}
            className={`${btn} bg-[#3385c8] text-white hover:bg-[#2875b4]`}
          >
            {busy ? "Mengaktifkan..." : "Aktifkan notifikasi"}
          </button>
        )}
      </div>
      {message && (
        <p
          role={message.ok ? "status" : "alert"}
          className={`rounded-xl px-4 py-3 text-sm ${
            message.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
