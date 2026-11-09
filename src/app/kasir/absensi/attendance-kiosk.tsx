"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { kioskToggle, selfToggle } from "./actions";

export type KioskEmployee = {
  id: string;
  name: string;
  jobTitle: string | null;
  hasPin: boolean;
  isMe: boolean;
  state: "working" | "done" | "none";
  label: string;
};

const TONE = {
  working: "bg-emerald-50 text-emerald-700",
  done: "bg-[#e8f3fc] text-[#2875b4]",
  none: "bg-[#f0f2f5] text-[#7183a0]",
} as const;

export default function AttendanceKiosk({ employees }: { employees: KioskEmployee[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<KioskEmployee | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function open(e: KioskEmployee) {
    setSelected(e);
    setPin("");
    setError(null);
  }

  function onSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const data = new FormData(ev.currentTarget);
    startTransition(async () => {
      const res = await kioskToggle(data);
      if (res.ok) {
        setToast(res.message ?? "Tersimpan.");
        setSelected(null);
        router.refresh();
      } else {
        setError(res.error ?? "Gagal mencatat absensi.");
        setPin("");
      }
    });
  }

  return (
    <div className="space-y-4">
      {toast && (
        <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {toast}
        </p>
      )}

      {employees.length === 0 ? (
        <p className="rounded-2xl bg-white p-8 text-center text-sm text-[#7183a0]">
          Belum ada karyawan aktif. Minta owner menambahkan karyawan.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {employees.map((e) => (
            <li key={e.id} className="rounded-2xl bg-white p-4 shadow-[0_15px_50px_rgba(51,133,200,0.08)]">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#e8f3fc] text-base font-bold uppercase text-[#2875b4]">
                    {e.name.charAt(0)}
                  </span>
                  <div>
                    <p className="font-semibold">
                      {e.name}
                      {e.isMe && <span className="ml-2 text-xs font-normal text-[#7183a0]">(kamu)</span>}
                    </p>
                    <p className="text-xs text-[#7183a0]">{e.jobTitle ?? "—"}</p>
                  </div>
                </div>
                <span className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-semibold ${TONE[e.state]}`}>{e.label}</span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {e.isMe && (
                  <form action={selfToggle}>
                    <button
                      type="submit"
                      className="rounded-xl bg-[#3385c8] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2875b4]"
                    >
                      {e.state === "working" ? "Clock-out (tanpa PIN)" : "Clock-in (tanpa PIN)"}
                    </button>
                  </form>
                )}
                <button
                  type="button"
                  disabled={!e.hasPin}
                  onClick={() => open(e)}
                  className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${
                    e.isMe
                      ? "border border-[#d6e2ef] bg-white text-[#2875b4] hover:bg-[#e8f3fc]"
                      : e.state === "working"
                        ? "bg-red-500 text-white hover:bg-red-600"
                        : "bg-[#3385c8] text-white hover:bg-[#2875b4]"
                  }`}
                >
                  {e.hasPin ? (e.state === "working" ? "Clock-out dengan PIN" : "Clock-in dengan PIN") : "PIN belum diatur"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 p-4 sm:items-center" role="dialog" aria-modal="true">
          <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow-2xl">
            <div>
              <p className="text-lg font-bold">{selected.name}</p>
              <p className="text-sm text-[#7183a0]">
                Masukkan PIN untuk {selected.state === "working" ? "clock-out" : "clock-in"}.
              </p>
            </div>
            <input type="hidden" name="employeeId" value={selected.id} />
            <input
              name="pin"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              autoFocus
              maxLength={6}
              value={pin}
              disabled={pending}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="••••"
              className="w-full rounded-xl border border-[#d6e2ef] px-4 py-4 text-center font-mono text-2xl tracking-[0.5em] outline-none focus:border-[#3385c8] focus:ring-4 focus:ring-[#3385c8]/10"
            />
            {error && (
              <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setSelected(null)}
                disabled={pending}
                className="flex-1 rounded-xl border border-[#d6e2ef] bg-white py-3.5 font-semibold text-[#4a5f7d] transition hover:bg-[#f7fbff]"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={pending || pin.length < 4}
                className="flex-1 rounded-xl bg-[#3385c8] py-3.5 font-semibold text-white transition hover:bg-[#2875b4] disabled:opacity-60"
              >
                {pending ? "Memproses..." : "Konfirmasi"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
