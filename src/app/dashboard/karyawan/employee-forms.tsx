"use client";

import { startTransition, useActionState, useState, type FormEvent, type ReactNode } from "react";
import Field from "@/components/Field";
import PasswordField from "@/components/PasswordField";
import {
  createEmployee,
  createEmployeeAccount,
  resetAccountPassword,
  setEmployeePin,
  updateEmployee,
  type EmpState,
} from "./actions";

const card = "rounded-2xl bg-white p-5 shadow-[0_15px_50px_rgba(51,133,200,0.08)] sm:p-6";
const primary =
  "rounded-xl bg-[#3385c8] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#2875b4] disabled:opacity-60";
const textarea =
  "w-full rounded-xl border border-[#d6e2ef] bg-white px-4 py-3 text-sm outline-none transition placeholder:text-[#9aabc0] focus:border-[#3385c8] focus:ring-4 focus:ring-[#3385c8]/10 disabled:opacity-60";

function Notice({ state }: { state: EmpState }) {
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

/** Kirim lewat onSubmit supaya isian tidak ter-reset saat ada error. */
function useSubmit(action: (data: FormData) => void) {
  return (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => action(data));
  };
}

function PinInput({ id, label, hint, disabled }: { id: string; label: string; hint?: string; disabled?: boolean }) {
  const [value, setValue] = useState("");
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-[#102a4c]">
        {label}
      </label>
      <input
        id={id}
        name="pin"
        inputMode="numeric"
        autoComplete="off"
        maxLength={6}
        value={value}
        disabled={disabled}
        onChange={(e) => setValue(e.target.value.replace(/\D/g, "").slice(0, 6))}
        placeholder="4–6 angka"
        className="w-full rounded-xl border border-[#d6e2ef] bg-white px-4 py-3.5 font-mono text-sm tracking-widest outline-none transition placeholder:font-sans placeholder:tracking-normal placeholder:text-[#9aabc0] focus:border-[#3385c8] focus:ring-4 focus:ring-[#3385c8]/10 disabled:opacity-60"
      />
      {hint && <p className="mt-1.5 text-xs text-[#7183a0]">{hint}</p>}
    </div>
  );
}

export type EmployeeValues = {
  id?: string;
  name: string;
  jobTitle: string;
  phone: string;
  hiredOn: string;
  note: string;
};

function EmployeeFields({ values, disabled }: { values?: EmployeeValues; disabled: boolean }) {
  return (
    <>
      <Field id="name" label="Nama lengkap" required maxLength={80} defaultValue={values?.name ?? ""} disabled={disabled} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="jobTitle"
          label="Jabatan (opsional)"
          maxLength={40}
          defaultValue={values?.jobTitle ?? ""}
          disabled={disabled}
          placeholder="Contoh: Barista, Kasir, Pelayan"
        />
        <Field
          id="phone"
          label="Telepon (opsional)"
          type="tel"
          defaultValue={values?.phone ?? ""}
          disabled={disabled}
          placeholder="08xxxxxxxxxx"
        />
      </div>
      <Field id="hiredOn" label="Tanggal masuk (opsional)" type="date" defaultValue={values?.hiredOn ?? ""} disabled={disabled} />
      <div>
        <label htmlFor="note" className="mb-2 block text-sm font-semibold text-[#102a4c]">
          Catatan (opsional)
        </label>
        <textarea id="note" name="note" rows={2} maxLength={200} defaultValue={values?.note ?? ""} disabled={disabled} className={textarea} />
      </div>
    </>
  );
}

export function AddEmployeeForm() {
  const [state, action, pending] = useActionState<EmpState, FormData>(createEmployee, null);
  return (
    <form key={state?.success ? state.at : 0} onSubmit={useSubmit(action)} className={`${card} space-y-4`}>
      <h2 className="text-lg font-bold">Tambah karyawan</h2>
      <EmployeeFields disabled={pending} />
      <PinInput
        id="new-pin"
        label="PIN absensi (opsional)"
        hint="Dipakai karyawan untuk clock-in/out di perangkat toko. Bisa diatur nanti."
        disabled={pending}
      />
      <Notice state={state} />
      <button type="submit" disabled={pending} className={primary}>
        {pending ? "Menyimpan..." : "Tambah karyawan"}
      </button>
    </form>
  );
}

export function EditEmployeeForm({ values }: { values: EmployeeValues }) {
  const [state, action, pending] = useActionState<EmpState, FormData>(updateEmployee, null);
  return (
    <form onSubmit={useSubmit(action)} className={`${card} space-y-4`}>
      <h2 className="text-lg font-bold">Data karyawan</h2>
      <input type="hidden" name="id" value={values.id} />
      <EmployeeFields values={values} disabled={pending} />
      <Notice state={state} />
      <button type="submit" disabled={pending} className={primary}>
        {pending ? "Menyimpan..." : "Simpan"}
      </button>
    </form>
  );
}

export function PinForm({ id, hasPin }: { id: string; hasPin: boolean }) {
  const [state, action, pending] = useActionState<EmpState, FormData>(setEmployeePin, null);
  return (
    <form key={state?.success ? state.at : 0} onSubmit={useSubmit(action)} className={`${card} space-y-4`}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold">PIN absensi</h2>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            hasPin ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
          }`}
        >
          {hasPin ? "Sudah diatur" : "Belum diatur"}
        </span>
      </div>
      <input type="hidden" name="id" value={id} />
      <PinInput
        id={`pin-${id}`}
        label={hasPin ? "PIN baru" : "Atur PIN"}
        hint="PIN disimpan terenkripsi dan tidak bisa dilihat lagi. Setelah 5 kali salah, PIN terkunci 5 menit."
        disabled={pending}
      />
      <Notice state={state} />
      <button type="submit" disabled={pending} className={primary}>
        {pending ? "Menyimpan..." : hasPin ? "Ganti PIN" : "Simpan PIN"}
      </button>
    </form>
  );
}

export function CreateAccountForm({ id, disabled }: { id: string; disabled: boolean }) {
  const [state, action, pending] = useActionState<EmpState, FormData>(createEmployeeAccount, null);
  return (
    <form key={state?.success ? state.at : 0} onSubmit={useSubmit(action)} className="space-y-4">
      <input type="hidden" name="id" value={id} />
      <Field
        id="username"
        label="Username"
        required
        autoCapitalize="none"
        spellCheck={false}
        disabled={pending || disabled}
        hint="Dipakai untuk login. Tanpa spasi, 3–20 karakter. Harus unik di seluruh LoomraPOS."
      />
      <PasswordField id="password" label="Password" required minLength={8} maxLength={72} autoComplete="new-password" disabled={pending || disabled} hint="Minimal 8 karakter." />
      <Notice state={state} />
      <button type="submit" disabled={pending || disabled} className={primary}>
        {pending ? "Membuat..." : "Buat akun login"}
      </button>
    </form>
  );
}

export function ResetAccountPasswordForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState<EmpState, FormData>(resetAccountPassword, null);
  return (
    <form key={state?.success ? state.at : 0} onSubmit={useSubmit(action)} className="space-y-3 rounded-xl bg-[#f7fbff] p-4">
      <input type="hidden" name="id" value={id} />
      <PasswordField id={`reset-${id}`} label="Password baru" required minLength={8} maxLength={72} autoComplete="new-password" disabled={pending} />
      <Notice state={state} />
      <button type="submit" disabled={pending} className={primary}>
        {pending ? "Menyimpan..." : "Simpan password"}
      </button>
    </form>
  );
}

/** Pembungkus form yang bisa dibuka-tutup. */
export function Collapsible({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg border border-[#d6e2ef] bg-white px-3 py-2 text-xs font-semibold text-[#2875b4] transition hover:bg-[#e8f3fc]"
      >
        {open ? "Tutup" : label}
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}
