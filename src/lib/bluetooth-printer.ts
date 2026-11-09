"use client";

import { useSyncExternalStore } from "react";

/* Tipe Web Bluetooth secukupnya (belum ada di lib.dom bawaan TypeScript). */
type BtCharacteristic = {
  properties: { write: boolean; writeWithoutResponse: boolean };
  writeValue(value: Uint8Array): Promise<void>;
  writeValueWithoutResponse?(value: Uint8Array): Promise<void>;
};
type BtService = { getCharacteristics(): Promise<BtCharacteristic[]> };
type BtServer = {
  connected: boolean;
  connect(): Promise<BtServer>;
  disconnect(): void;
  getPrimaryService(uuid: string): Promise<BtService>;
};
type BtDevice = {
  name?: string;
  gatt?: BtServer;
  addEventListener(type: string, listener: () => void): void;
};
type BtApi = { requestDevice(options: unknown): Promise<BtDevice> };

/** Layanan BLE yang umum dipakai printer struk thermal. */
const SERVICES = [
  "0000ff00-0000-1000-8000-00805f9b34fb",
  "000018f0-0000-1000-8000-00805f9b34fb",
  "49535343-fe7d-4ae5-8fa9-9fafd205e455",
  "e7810a71-73ae-499d-8c15-faa9aef0c3f2",
  "0000ffe0-0000-1000-8000-00805f9b34fb",
  "0000ae30-0000-1000-8000-00805f9b34fb",
];

const AUTO_KEY = "loomrapos.printer.autoPrint";

export type PrinterState = {
  supported: boolean;
  secure: boolean;
  status: "idle" | "connecting" | "connected";
  deviceName: string | null;
  error: string | null;
  autoPrint: boolean;
};

const SERVER_STATE: PrinterState = {
  supported: false,
  secure: false,
  status: "idle",
  deviceName: null,
  error: null,
  autoPrint: false,
};

let state: PrinterState = SERVER_STATE;
let initialized = false;
const listeners = new Set<() => void>();

let device: BtDevice | null = null;
let channel: BtCharacteristic | null = null;
let manualDisconnect = false;
let chunkSize = 100;

function getBt(): BtApi | null {
  if (typeof navigator === "undefined") return null;
  return (navigator as unknown as { bluetooth?: BtApi }).bluetooth ?? null;
}

function init() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  let auto = false;
  try {
    auto = window.localStorage.getItem(AUTO_KEY) === "1";
  } catch {
    /* penyimpanan tidak tersedia */
  }
  state = { ...state, supported: !!getBt(), secure: window.isSecureContext, autoPrint: auto };
}

function set(patch: Partial<PrinterState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export function getPrinterState() {
  init();
  return state;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function usePrinter(): PrinterState {
  return useSyncExternalStore(subscribe, getPrinterState, () => SERVER_STATE);
}

export function setAutoPrint(value: boolean) {
  try {
    window.localStorage.setItem(AUTO_KEY, value ? "1" : "0");
  } catch {
    /* abaikan */
  }
  set({ autoPrint: value });
}

function onDisconnected() {
  channel = null;
  if (manualDisconnect) return;
  set({ status: "idle", error: "Koneksi printer terputus." });
}

async function findWritable(server: BtServer): Promise<BtCharacteristic> {
  for (const uuid of SERVICES) {
    try {
      const service = await server.getPrimaryService(uuid);
      const chars = await service.getCharacteristics();
      const found =
        chars.find((c) => c.properties.writeWithoutResponse) ?? chars.find((c) => c.properties.write);
      if (found) return found;
    } catch {
      /* layanan ini tidak ada di printer, coba berikutnya */
    }
  }
  throw new Error(
    "Printer terhubung, tetapi tidak punya jalur cetak Bluetooth LE yang dikenali. Printer ini mungkin tipe Bluetooth klasik.",
  );
}

async function open(target: BtDevice) {
  if (!target.gatt) throw new Error("Perangkat ini tidak mendukung koneksi GATT.");
  const server = await target.gatt.connect();
  channel = await findWritable(server);
}

function friendly(e: unknown) {
  const err = e as { name?: string; message?: string };
  if (err?.name === "SecurityError") return "Izin Bluetooth ditolak. Izinkan Bluetooth untuk situs ini.";
  if (err?.name === "NetworkError") return "Gagal terhubung ke printer. Pastikan printer menyala dan dekat.";
  return err?.message || "Gagal terhubung ke printer.";
}

/** Harus dipanggil dari klik pengguna (syarat browser). */
export async function connectPrinter(): Promise<void> {
  init();
  const bt = getBt();
  if (!bt) {
    const msg = window.isSecureContext
      ? "Browser ini tidak mendukung Bluetooth. Pakai Chrome di Android atau komputer."
      : "Bluetooth hanya bisa dipakai lewat alamat https.";
    set({ error: msg });
    throw new Error(msg);
  }

  set({ status: "connecting", error: null });

  let picked: BtDevice;
  try {
    picked = await bt.requestDevice({ acceptAllDevices: true, optionalServices: SERVICES });
  } catch (e) {
    // Pengguna menutup jendela pilih perangkat: bukan error.
    if ((e as { name?: string })?.name === "NotFoundError") {
      set({ status: state.deviceName && channel ? "connected" : "idle" });
      return;
    }
    set({ status: "idle", error: friendly(e) });
    throw e;
  }

  try {
    manualDisconnect = false;
    device = picked;
    picked.addEventListener("gattserverdisconnected", onDisconnected);
    await open(picked);
    set({ status: "connected", deviceName: picked.name || "Printer", error: null });
  } catch (e) {
    channel = null;
    set({ status: "idle", deviceName: null, error: friendly(e) });
    throw e;
  }
}

export function disconnectPrinter() {
  manualDisconnect = true;
  device?.gatt?.disconnect();
  channel = null;
  set({ status: "idle", deviceName: null, error: null });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function ensureChannel(): Promise<BtCharacteristic> {
  if (channel && device?.gatt?.connected) return channel;
  if (!device) throw new Error("Printer belum terhubung.");
  try {
    await open(device); // sambung ulang senyap untuk perangkat yang sama
    set({ status: "connected", error: null });
    return channel as unknown as BtCharacteristic;
  } catch {
    set({ status: "idle", error: "Koneksi printer terputus. Hubungkan lagi." });
    throw new Error("Printer tidak terhubung. Hubungkan lagi.");
  }
}

/** Kirim data ke printer. Ukuran paket otomatis mengecil kalau printer menolak paket besar. */
export async function printBytes(bytes: Uint8Array): Promise<void> {
  const ch = await ensureChannel();
  let offset = 0;

  while (offset < bytes.length) {
    const slice = bytes.slice(offset, offset + chunkSize);
    try {
      if (ch.properties.writeWithoutResponse && ch.writeValueWithoutResponse) {
        await ch.writeValueWithoutResponse(slice);
      } else {
        await ch.writeValue(slice);
      }
      offset += slice.length;
      await sleep(chunkSize <= 20 ? 30 : 12);
    } catch (e) {
      if (chunkSize > 20) {
        chunkSize = Math.max(20, Math.floor(chunkSize / 2));
        continue;
      }
      throw new Error(friendly(e) || "Gagal mengirim data ke printer.");
    }
  }
}
