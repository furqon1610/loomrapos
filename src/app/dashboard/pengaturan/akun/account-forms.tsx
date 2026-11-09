"use client";

import Link from "next/link";
import { startTransition, useActionState, type FormEvent } from "react";
import Field from "@/components/Field";
import PasswordField from "@/components/PasswordField";
import {
  changePassword,
  updateProfile,
  type AccountState,
} from "./actions";

const card = "rounded-2xl bg-white p-5 shadow-[0_15px_50px_rgba(51,133,200,0.08)] sm:p-6";
const submitBtn =
  "rounded-xl bg-[#3385c8] px-6 py-3.5 font-semibold text-white transition hover:bg-[#2875b4] disabled:opacity-70";

function Notice({ state }: { state: AccountState }) {
  if (state?.error) {
    return (
      <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
        {state.error}
      </p>
    );
  }
  if (state?.success) {
    return (
      <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
        {state.success}
      </p>
    );
  }
  return null;
}

export default function AccountForms({
  fullName,
  username,
  email,
}: {
  fullName: string;
  username: string;
  email: string;
}) {
  const [profileState, profileAction, profilePending] = useActionState<AccountState, FormData>(
    updateProfile,
    null,
  );
  const [passwordState, passwordAction, passwordPending] = useActionState<AccountState, FormData>(
    changePassword,
    null,
  );

  // Dikirim lewat onSubmit supaya isian tidak ter-reset kalau ada error.
  const submit =
    (action: (data: FormData) => void) => (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const data = new FormData(e.currentTarget);
      startTransition(() => action(data));
    };

  return (
    <div className="space-y-5">
      <form onSubmit={submit(profileAction)} className={`${card} space-y-4`}>
        <h2 className="text-lg font-bold">Profil</h2>
        <Field
          id="fullName"
          label="Nama lengkap"
          type="text"
          required
          maxLength={80}
          autoComplete="name"
          defaultValue={fullName}
          disabled={profilePending}
        />
        <Field
          id="username"
          label="Username"
          type="text"
          required
          autoCapitalize="none"
          spellCheck={false}
          autoComplete="username"
          defaultValue={username}
          disabled={profilePending}
          hint="Dipakai untuk login. Tanpa spasi, 3–20 karakter (huruf, angka, atau underscore)."
        />
        <div>
          <p className="mb-2 text-sm font-semibold text-[#102a4c]">Email</p>
          <p className="rounded-xl bg-[#f4f8fd] px-4 py-3.5 text-sm text-[#4a5f7d]">{email}</p>
          <p className="mt-1.5 text-xs text-[#7183a0]">Email tidak bisa diubah.</p>
        </div>
        <Notice state={profileState} />
        <button type="submit" disabled={profilePending} className={submitBtn}>
          {profilePending ? "Menyimpan..." : "Simpan profil"}
        </button>
      </form>

      <form
        key={passwordState?.success ? passwordState.at : 0}
        onSubmit={submit(passwordAction)}
        className={`${card} space-y-4`}
      >
        <h2 className="text-lg font-bold">Ganti password</h2>
        <PasswordField
          id="current_password"
          label="Password saat ini"
          required
          autoComplete="current-password"
          disabled={passwordPending}
        />
        <PasswordField
          id="new_password"
          label="Password baru"
          required
          minLength={8}
          maxLength={72}
          autoComplete="new-password"
          disabled={passwordPending}
          hint="Minimal 8 karakter."
        />
        <PasswordField
          id="confirm_password"
          label="Ulangi password baru"
          required
          minLength={8}
          maxLength={72}
          autoComplete="new-password"
          disabled={passwordPending}
        />
        <Notice state={passwordState} />
        <button type="submit" disabled={passwordPending} className={submitBtn}>
          {passwordPending ? "Menyimpan..." : "Ganti password"}
        </button>
      </form>

      <Link
        href="/dashboard/pengaturan"
        className="inline-block text-sm font-semibold text-[#3385c8] hover:underline"
      >
        ← Kembali ke Pengaturan
      </Link>
    </div>
  );
}
