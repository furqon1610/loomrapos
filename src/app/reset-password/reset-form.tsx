"use client";

import { startTransition, useActionState, type FormEvent } from "react";
import PasswordField from "@/components/PasswordField";
import { resetPassword, type ResetState } from "./actions";

export default function ResetForm() {
  const [state, action, pending] = useActionState<ResetState, FormData>(resetPassword, null);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => action(data));
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <PasswordField
        id="password"
        label="Password baru"
        required
        minLength={8}
        maxLength={72}
        autoComplete="new-password"
        disabled={pending}
        hint="Minimal 8 karakter."
      />
      <PasswordField
        id="confirm"
        label="Ulangi password baru"
        required
        minLength={8}
        maxLength={72}
        autoComplete="new-password"
        disabled={pending}
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
        {pending ? "Menyimpan..." : "Simpan password baru"}
      </button>
    </form>
  );
}
