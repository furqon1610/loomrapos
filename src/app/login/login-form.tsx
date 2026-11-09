"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { login, type LoginState } from "./actions";
import { Icon } from "@/components/icons";

export default function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    login,
    null,
  );
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction}>
      {/* Username */}
      <div>
        <label
          htmlFor="username"
          className="mb-2 block text-sm font-semibold text-[#102a4c]"
        >
          Username
        </label>

        <div className="flex items-center rounded-xl border border-[#d6e2ef] bg-white transition focus-within:border-[#3385c8] focus-within:ring-4 focus-within:ring-[#3385c8]/10">
          <span className="pl-4 text-xl text-[#7890ae]" aria-hidden="true">
            👤
          </span>

          <input
            id="username"
            name="username"
            type="text"
            required
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            defaultValue={state?.username ?? ""}
            disabled={pending}
            placeholder="Masukkan username Anda"
            className="w-full bg-transparent px-4 py-4 text-sm text-[#102a4c] outline-none placeholder:text-[#9aabc0]"
          />
        </div>
      </div>

      {/* Password */}
      <div className="mt-5">
        <label
          htmlFor="password"
          className="mb-2 block text-sm font-semibold text-[#102a4c]"
        >
          Password
        </label>

        <div className="flex items-center rounded-xl border border-[#d6e2ef] bg-white transition focus-within:border-[#3385c8] focus-within:ring-4 focus-within:ring-[#3385c8]/10">
          <span className="pl-4 text-xl text-[#7890ae]" aria-hidden="true">
            🔒
          </span>

          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            disabled={pending}
            placeholder="Masukkan password Anda"
            className="w-full bg-transparent px-4 py-4 text-sm text-[#102a4c] outline-none placeholder:text-[#9aabc0]"
          />

          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
            aria-pressed={showPassword}
            className="pr-4 text-lg text-[#7890ae]"
          >
            <Icon name={showPassword ? "eye" : "eyeOff"} className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Error */}
      {state?.error && (
        <p
          role="alert"
          className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600"
        >
          {state.error}
        </p>
      )}

      {/* Remember & Forgot Password */}
      <div className="mt-5 flex items-center justify-between gap-3 text-sm">
        <label className="flex cursor-pointer items-center gap-2 text-[#7183a0]">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-[#cbd8e6] accent-[#3385c8]"
          />
          Ingat saya
        </label>

        <Link
          href="/forgot-password"
          className="font-medium text-[#3385c8] hover:underline"
        >
          Lupa password?
        </Link>
      </div>

      {/* Login Button */}
      <button
        type="submit"
        disabled={pending}
        className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl bg-[#3385c8] py-4 font-semibold text-white shadow-lg shadow-[#3385c8]/20 transition hover:bg-[#2875b4] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Memproses..." : "Login"}
        {!pending && <span className="text-xl">→</span>}
      </button>
    </form>
  );
}
