"use client";

export default function ConfirmForm({
  action,
  fields,
  label,
  confirmMessage,
  tone = "neutral",
}: {
  action: (formData: FormData) => void | Promise<void>;
  fields: Record<string, string>;
  label: string;
  /** Kalau diisi, pengguna diminta konfirmasi dulu sebelum aksi dijalankan. */
  confirmMessage?: string;
  tone?: "neutral" | "danger" | "success";
}) {
  const toneClass =
    tone === "danger"
      ? "border-red-200 text-red-600 hover:bg-red-50"
      : tone === "success"
        ? "border-[#d6e2ef] text-emerald-700 hover:bg-emerald-50"
        : "border-[#d6e2ef] text-[#2875b4] hover:bg-[#e8f3fc]";

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (confirmMessage && !confirm(confirmMessage)) e.preventDefault();
      }}
    >
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <button type="submit" className={`rounded-lg border bg-white px-3 py-2 text-xs font-semibold transition ${toneClass}`}>
        {label}
      </button>
    </form>
  );
}
