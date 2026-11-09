"use client";

import { useState, type InputHTMLAttributes } from "react";
import { Icon } from "@/components/icons";

export default function PasswordField({
  id,
  label,
  hint,
  ...props
}: { id: string; label: string; hint?: string } & Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
>) {
  const [show, setShow] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-[#102a4c]">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          {...props}
          type={show ? "text" : "password"}
          className="w-full rounded-xl border border-[#d6e2ef] bg-white py-3.5 pl-4 pr-12 text-sm text-[#102a4c] outline-none transition placeholder:text-[#9aabc0] focus:border-[#3385c8] focus:ring-4 focus:ring-[#3385c8]/10 disabled:opacity-60"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "Sembunyikan password" : "Lihat password"}
          aria-pressed={show}
          className="absolute inset-y-0 right-0 flex items-center px-4 text-[#7890ae] transition hover:text-[#102a4c]"
        >
          <Icon name={show ? "eye" : "eyeOff"} className="h-5 w-5" />
        </button>
      </div>
      {hint && <p className="mt-1.5 text-xs text-[#7183a0]">{hint}</p>}
    </div>
  );
}
