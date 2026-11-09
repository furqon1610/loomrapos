import type { InputHTMLAttributes } from "react";

export default function Field({
  id,
  label,
  hint,
  ...props
}: { id: string; label: string; hint?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-[#102a4c]">
        {label}
      </label>
      <input
        id={id}
        name={id}
        {...props}
        className="w-full rounded-xl border border-[#d6e2ef] bg-white px-4 py-3.5 text-sm text-[#102a4c] outline-none transition placeholder:text-[#9aabc0] focus:border-[#3385c8] focus:ring-4 focus:ring-[#3385c8]/10 disabled:opacity-60"
      />
      {hint && <p className="mt-1.5 text-xs text-[#7183a0]">{hint}</p>}
    </div>
  );
}
