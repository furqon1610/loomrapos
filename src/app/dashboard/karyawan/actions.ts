"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProOwner } from "@/lib/tenant";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { UUID_RE } from "@/lib/pos";

export type EmpState = { error?: string; success?: string; at?: number } | null;

const MAX_ACTIVE_ACCOUNTS = 3;
const USERNAME_RE = /^[a-z0-9_]{3,20}$/;
const PHONE_RE = /^[0-9+\-\s]{6,20}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const PIN_RE = /^\d{4,6}$/;

const LIST = "/dashboard/karyawan/daftar";

type Employee = { id: string; name: string; user_id: string | null; active: boolean };

async function findEmployee(tenantId: string, id: string): Promise<Employee | null> {
  if (!UUID_RE.test(id)) return null;
  const { data } = await supabaseAdmin
    .from("employees")
    .select("id, name, user_id, active")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  return data as Employee | null;
}

async function countActiveAccounts(tenantId: string) {
  const { count } = await supabaseAdmin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("role", "cashier")
    .eq("active", true);
  return count ?? 0;
}

/** Nonaktifkan/aktifkan akun login (blokir di Supabase Auth + penanda di profil). */
async function setAccountActive(userId: string, active: boolean): Promise<string | null> {
  const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    ban_duration: active ? "none" : "876000h",
  });
  if (banError) return "Gagal mengubah status akun login. Coba lagi.";
  const { error } = await supabaseAdmin.from("profiles").update({ active }).eq("id", userId);
  if (error) {
    return error.message.includes("cashier_limit")
      ? "Batas 3 akun kasir aktif sudah tercapai. Nonaktifkan salah satu dulu."
      : "Gagal mengubah status akun login. Coba lagi.";
  }
  return null;
}

type Fields = { name: string; jobTitle: string; phone: string; hiredOn: string; note: string };

function readFields(formData: FormData): Fields {
  return {
    name: String(formData.get("name") ?? "").trim(),
    jobTitle: String(formData.get("jobTitle") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    hiredOn: String(formData.get("hiredOn") ?? "").trim(),
    note: String(formData.get("note") ?? "").trim(),
  };
}

function validateFields(f: Fields): string | null {
  if (f.name.length < 2 || f.name.length > 80) return "Nama wajib diisi (2–80 karakter).";
  if (f.jobTitle.length > 40) return "Jabatan maksimal 40 karakter.";
  if (f.phone && !PHONE_RE.test(f.phone)) return "Nomor telepon tidak valid.";
  if (f.hiredOn && (!DATE_RE.test(f.hiredOn) || Number.isNaN(Date.parse(f.hiredOn)))) {
    return "Tanggal masuk tidak valid.";
  }
  if (f.note.length > 200) return "Catatan maksimal 200 karakter.";
  return null;
}

// ---------------- Karyawan ----------------

export async function createEmployee(_prev: EmpState, formData: FormData): Promise<EmpState> {
  const { tenant } = await requireProOwner();
  const f = readFields(formData);
  const pin = String(formData.get("pin") ?? "").trim();

  const invalid = validateFields(f);
  if (invalid) return { error: invalid };
  if (pin && !PIN_RE.test(pin)) return { error: "PIN harus 4–6 angka." };

  const { data: created, error } = await supabaseAdmin
    .from("employees")
    .insert({
      tenant_id: tenant.id,
      name: f.name,
      job_title: f.jobTitle || null,
      phone: f.phone || null,
      hired_on: f.hiredOn || null,
      note: f.note || null,
    })
    .select("id")
    .single();
  if (error || !created) {
    return {
      error: error?.message.includes("employee_limit")
        ? "Batas 50 karyawan aktif sudah tercapai."
        : "Gagal menambah karyawan. Coba lagi.",
    };
  }

  if (pin) {
    const { error: pinError } = await supabaseAdmin.rpc("set_employee_pin", {
      p_tenant: tenant.id,
      p_employee: created.id,
      p_pin: pin,
    });
    if (pinError) {
      return { success: `${f.name} ditambahkan, tetapi PIN gagal disimpan. Atur PIN dari halaman detail.`, at: Date.now() };
    }
  }

  revalidatePath(LIST);
  return { success: `${f.name} ditambahkan.`, at: Date.now() };
}

export async function updateEmployee(_prev: EmpState, formData: FormData): Promise<EmpState> {
  const { tenant } = await requireProOwner();
  const emp = await findEmployee(tenant.id, String(formData.get("id") ?? ""));
  if (!emp) return { error: "Karyawan tidak ditemukan." };

  const f = readFields(formData);
  const invalid = validateFields(f);
  if (invalid) return { error: invalid };

  const { error } = await supabaseAdmin
    .from("employees")
    .update({
      name: f.name,
      job_title: f.jobTitle || null,
      phone: f.phone || null,
      hired_on: f.hiredOn || null,
      note: f.note || null,
    })
    .eq("id", emp.id);
  if (error) return { error: "Gagal menyimpan. Coba lagi." };

  // Nama di akun login mengikuti nama karyawan.
  if (emp.user_id) await supabaseAdmin.from("profiles").update({ full_name: f.name }).eq("id", emp.user_id);

  revalidatePath(LIST);
  revalidatePath(`${LIST}/${emp.id}`);
  return { success: "Data karyawan tersimpan.", at: Date.now() };
}

export async function setEmployeePin(_prev: EmpState, formData: FormData): Promise<EmpState> {
  const { tenant } = await requireProOwner();
  const emp = await findEmployee(tenant.id, String(formData.get("id") ?? ""));
  if (!emp) return { error: "Karyawan tidak ditemukan." };

  const pin = String(formData.get("pin") ?? "").trim();
  if (!PIN_RE.test(pin)) return { error: "PIN harus 4–6 angka." };

  const { error } = await supabaseAdmin.rpc("set_employee_pin", {
    p_tenant: tenant.id,
    p_employee: emp.id,
    p_pin: pin,
  });
  if (error) return { error: "Gagal menyimpan PIN. Coba lagi." };

  revalidatePath(LIST);
  revalidatePath(`${LIST}/${emp.id}`);
  return { success: "PIN disimpan. Berikan PIN ini ke karyawan.", at: Date.now() };
}

/** Aktif/nonaktifkan karyawan. Kalau punya akun login, akunnya ikut. */
export async function setEmployeeActive(formData: FormData) {
  const { tenant } = await requireProOwner();
  const emp = await findEmployee(tenant.id, String(formData.get("id") ?? ""));
  const activate = formData.get("active") === "1";
  const back = emp ? `${LIST}/${emp.id}` : LIST;
  const fail = (msg: string): never => redirect(`${back}?error=${encodeURIComponent(msg)}`);

  if (!emp) fail("Karyawan tidak ditemukan.");
  const e = emp as Employee;

  if (activate && e.user_id && (await countActiveAccounts(tenant.id)) >= MAX_ACTIVE_ACCOUNTS) {
    fail("Batas 3 akun kasir aktif sudah tercapai. Nonaktifkan akun lain dulu.");
  }

  const { error } = await supabaseAdmin.from("employees").update({ active: activate }).eq("id", e.id);
  if (error) {
    fail(error.message.includes("employee_limit") ? "Batas 50 karyawan aktif sudah tercapai." : "Gagal mengubah status. Coba lagi.");
  }
  if (e.user_id) {
    const accountError = await setAccountActive(e.user_id, activate);
    if (accountError) fail(accountError);
  }

  revalidatePath(LIST);
  redirect(`${LIST}/${e.id}`);
}

/** Owner mencatat clock-in/out secara manual (mis. karyawan lupa atau tidak sempat absen). */
export async function manualAttendance(formData: FormData) {
  const { tenant } = await requireProOwner();
  const emp = await findEmployee(tenant.id, String(formData.get("id") ?? ""));
  if (!emp) redirect(`${LIST}?error=${encodeURIComponent("Karyawan tidak ditemukan.")}`);
  const e = emp as Employee;

  const { data, error } = await supabaseAdmin.rpc("employee_owner_toggle", {
    p_tenant: tenant.id,
    p_employee: e.id,
  });
  if (error) {
    redirect(`${LIST}/${e.id}?error=${encodeURIComponent(error.message.includes("not_allowed") ? "Karyawan nonaktif tidak bisa diabsen." : "Gagal mencatat absensi.")}`);
  }

  const action = (data as { action?: string } | null)?.action === "out" ? "Clock-out" : "Clock-in";
  revalidatePath(`${LIST}/${e.id}`);
  redirect(`${LIST}/${e.id}?ok=${encodeURIComponent(`${action} dicatat.`)}`);
}

// ---------------- Akun login kasir ----------------

export async function createEmployeeAccount(_prev: EmpState, formData: FormData): Promise<EmpState> {
  const { tenant } = await requireProOwner();
  const emp = await findEmployee(tenant.id, String(formData.get("id") ?? ""));
  if (!emp) return { error: "Karyawan tidak ditemukan." };
  if (emp.user_id) return { error: "Karyawan ini sudah punya akun login." };
  if (!emp.active) return { error: "Aktifkan karyawan dulu sebelum membuat akun login." };

  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!USERNAME_RE.test(username)) {
    return { error: "Username hanya boleh huruf, angka, dan underscore (tanpa spasi), 3–20 karakter." };
  }
  if (password.length < 8 || password.length > 72) return { error: "Password minimal 8 karakter." };

  if ((await countActiveAccounts(tenant.id)) >= MAX_ACTIVE_ACCOUNTS) {
    return { error: "Batas 3 akun kasir aktif sudah tercapai. Nonaktifkan akun lain dulu." };
  }

  const { data: taken } = await supabaseAdmin.from("profiles").select("id").eq("username", username).maybeSingle();
  if (taken) return { error: "Username sudah dipakai. Coba tambahkan nama toko, misalnya andi_warkop." };

  // Email hanya identitas teknis (kasir login dengan username), tidak pernah dipakai mengirim pesan.
  const email = `k-${crypto.randomUUID().slice(0, 10)}@loomrapos.com`;
  const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: emp.name },
  });
  if (createError || !created.user) {
    return { error: createError?.code === "weak_password" ? "Password terlalu lemah." : "Gagal membuat akun login. Coba lagi." };
  }

  const { error: profileError } = await supabaseAdmin.from("profiles").insert({
    id: created.user.id,
    username,
    full_name: emp.name,
    email,
    role: "cashier",
    tenant_id: tenant.id,
  });
  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(created.user.id);
    if (profileError.code === "23505") return { error: "Username sudah dipakai." };
    if (profileError.message.includes("cashier_limit")) return { error: "Batas 3 akun kasir aktif sudah tercapai." };
    return { error: "Gagal menyimpan akun login. Coba lagi." };
  }

  const { error: linkError } = await supabaseAdmin.from("employees").update({ user_id: created.user.id }).eq("id", emp.id);
  if (linkError) {
    await supabaseAdmin.auth.admin.deleteUser(created.user.id); // profil ikut terhapus (cascade)
    return { error: "Gagal menghubungkan akun ke karyawan. Coba lagi." };
  }

  revalidatePath(LIST);
  revalidatePath(`${LIST}/${emp.id}`);
  return { success: `Akun @${username} dibuat. Berikan username dan password ini ke ${emp.name}.`, at: Date.now() };
}

export async function resetAccountPassword(_prev: EmpState, formData: FormData): Promise<EmpState> {
  const { tenant } = await requireProOwner();
  const emp = await findEmployee(tenant.id, String(formData.get("id") ?? ""));
  if (!emp?.user_id) return { error: "Karyawan ini belum punya akun login." };

  const password = String(formData.get("password") ?? "");
  if (password.length < 8 || password.length > 72) return { error: "Password minimal 8 karakter." };

  const { error } = await supabaseAdmin.auth.admin.updateUserById(emp.user_id, { password });
  if (error) {
    return { error: error.code === "weak_password" ? "Password terlalu lemah." : "Gagal mengganti password. Coba lagi." };
  }
  return { success: "Password diganti.", at: Date.now() };
}

export async function toggleAccountActive(formData: FormData) {
  const { tenant } = await requireProOwner();
  const emp = await findEmployee(tenant.id, String(formData.get("id") ?? ""));
  const activate = formData.get("active") === "1";
  const back = emp ? `${LIST}/${emp.id}` : LIST;
  const fail = (msg: string): never => redirect(`${back}?error=${encodeURIComponent(msg)}`);

  if (!emp?.user_id) fail("Karyawan ini belum punya akun login.");
  const e = emp as Employee;
  if (activate && !e.active) fail("Aktifkan karyawan dulu.");
  if (activate && (await countActiveAccounts(tenant.id)) >= MAX_ACTIVE_ACCOUNTS) {
    fail("Batas 3 akun kasir aktif sudah tercapai. Nonaktifkan akun lain dulu.");
  }

  const accountError = await setAccountActive(e.user_id as string, activate);
  if (accountError) fail(accountError);

  revalidatePath(`${LIST}/${e.id}`);
  redirect(`${LIST}/${e.id}`);
}
