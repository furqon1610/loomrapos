"use client";

import { useActionState } from "react";
import { register, type RegisterState } from "./actions";
import Field from "@/components/Field";
import PasswordField from "@/components/PasswordField";

export default function RegisterForm({ plan }: { plan: "basic" | "pro" }) {
  const [state, formAction, pending] = useActionState<RegisterState, FormData>(register, null);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="plan" value={plan} />
      <Field
        id="fullName"
        label="Nama lengkap"
        type="text"
        required
        autoComplete="name"
        defaultValue={state?.values.fullName ?? ""}
        disabled={pending}
        placeholder="Contoh: Agus Santoso"
      />
      <Field
        id="username"
        label="Username"
        type="text"
        required
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        defaultValue={state?.values.username ?? ""}
        disabled={pending}
        pattern="[A-Za-z0-9_]{3,20}"
        title="3–20 karakter: huruf, angka, atau underscore. Tanpa spasi."
        placeholder="Contoh: agus_warkop"
        hint="Dipakai untuk login. Tanpa spasi, 3–20 karakter (huruf, angka, atau underscore)."
      />
      <Field
        id="email"
        label="Email"
        type="email"
        required
        autoComplete="email"
        defaultValue={state?.values.email ?? ""}
        disabled={pending}
        placeholder="nama@email.com"
      />
      <PasswordField
        id="password"
        label="Password"
        required
        minLength={8}
        maxLength={72}
        autoComplete="new-password"
        disabled={pending}
        placeholder="Minimal 8 karakter"
        hint="Minimal 8 karakter. Klik ikon mata untuk melihat password."
      />

      {state?.error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#3385c8] py-4 font-semibold text-white shadow-lg shadow-[#3385c8]/20 transition hover:bg-[#2875b4] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Membuat akun..." : "Daftar"}
      </button>
    </form>
  );
}
