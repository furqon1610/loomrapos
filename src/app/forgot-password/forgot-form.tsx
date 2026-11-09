"use client";

import { startTransition, useActionState, type FormEvent } from "react";
import Field from "@/components/Field";
import { requestPasswordReset, type ForgotState } from "./actions";

export default function ForgotForm() {
  const [state, action, pending] = useActionState<ForgotState, FormData>(requestPasswordReset, null);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => action(data));
  }

  if (state?.done) {
    return (
      <div className="space-y-3 rounded-xl bg-emerald-50 px-4 py-4 text-sm leading-6 text-emerald-800">
        <p className="font-semibold">Periksa email kamu.</p>
        <p>
          Kalau akunnya ditemukan, kami sudah mengirim tautan untuk membuat password baru. Cek juga folder spam.
          Tautan berlaku sebentar saja.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <Field
        id="identifier"
        label="Username atau email"
        type="text"
        required
        autoCapitalize="none"
        spellCheck={false}
        autoComplete="username"
        disabled={pending}
        placeholder="Masukkan username atau email"
      />

      {state?.error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center rounded-xl bg-[#3385c8] py-4 font-semibold text-white shadow-lg shadow-[#3385c8]/20 transition hover:bg-[#2875b4] disabled:opacity-70"
      >
        {pending ? "Mengirim..." : "Kirim tautan reset"}
      </button>
    </form>
  );
}
