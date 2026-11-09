"use client";

import { useState, type InputHTMLAttributes } from "react";
import { formatThousands, onlyDigits } from "@/lib/number-format";

/**
 * Input angka bulat dengan titik ribuan otomatis (5000 -> 5.000).
 * Nilai yang dikirim berupa teks berformat; server mengambil angkanya saja.
 */
export default function NumberField({
  id,
  label,
  hint,
  prefix,
  defaultValue,
  maxDigits = 12,
  ...props
}: {
  id: string;
  label: string;
  hint?: string;
  prefix?: string;
  defaultValue?: number | string;
  maxDigits?: number;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "defaultValue" | "onChange">) {
  const [value, setValue] = useState(
    defaultValue === undefined || defaultValue === ""
      ? ""
      : formatThousands(onlyDigits(String(defaultValue), maxDigits)),
  );

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-[#102a4c]">
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm font-semibold text-[#7183a0]">
            {prefix}
          </span>
        )}
        <input
          id={id}
          name={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          {...props}
          value={value}
          onChange={(e) => setValue(formatThousands(onlyDigits(e.target.value, maxDigits)))}
          className={`w-full rounded-xl border border-[#d6e2ef] bg-white py-3.5 pr-4 text-sm text-[#102a4c] outline-none transition placeholder:text-[#9aabc0] focus:border-[#3385c8] focus:ring-4 focus:ring-[#3385c8]/10 disabled:opacity-60 ${
            prefix ? "pl-11" : "pl-4"
          }`}
        />
      </div>
      {hint && <p className="mt-1.5 text-xs text-[#7183a0]">{hint}</p>}
    </div>
  );
}
