"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { Icon } from "@/components/icons";

type Shape = "square" | "fit";

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("decode"));
    img.src = url;
  });
}

/**
 * Kecilkan foto dan simpan sebagai JPEG berlatar putih.
 * "square": potong persegi dari tengah, 640px (foto produk).
 * "fit": pertahankan proporsi, sisi terpanjang 512px (logo).
 */
async function toJpeg(file: File, shape: Shape): Promise<File> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const w = img.naturalWidth;
    const h = img.naturalHeight;

    let sx = 0;
    let sy = 0;
    let sw = w;
    let sh = h;
    let outW: number;
    let outH: number;

    if (shape === "square") {
      const side = Math.min(w, h);
      sx = (w - side) / 2;
      sy = (h - side) / 2;
      sw = side;
      sh = side;
      outW = outH = Math.min(640, side);
    } else {
      const scale = Math.min(1, 512 / Math.max(w, h));
      outW = Math.max(1, Math.round(w * scale));
      outH = Math.max(1, Math.round(h * scale));
    }

    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, outW, outH);
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.85),
    );
    if (!blob) throw new Error("encode");
    return new File([blob], shape === "square" ? "produk.jpg" : "logo.jpg", { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Pilih gambar dari kamera atau galeri. File hasil kompres dimasukkan ke input
 * tersembunyi bernama "image" supaya ikut terkirim bersama form.
 */
export default function ImagePicker({
  currentUrl,
  pending,
  label = "Foto produk (opsional)",
  shape = "square",
  onChange,
}: {
  currentUrl: string | null;
  pending?: boolean;
  label?: string;
  shape?: Shape;
  /** Dipanggil saat gambar berganti: URL pratinjau baru, atau null kalau dihapus. */
  onChange?: (url: string | null) => void;
}) {
  const disabled = pending;
  const realRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const blobUrlRef = useRef<string | null>(null);

  const [preview, setPreview] = useState<string | null>(currentUrl);
  const [removed, setRemoved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // supaya file yang sama bisa dipilih ulang
    if (!file) return;

    setError(null);
    setBusy(true);
    try {
      const compressed = await toJpeg(file, shape);
      const dt = new DataTransfer();
      dt.items.add(compressed);
      if (realRef.current) realRef.current.files = dt.files;

      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = URL.createObjectURL(compressed);
      setPreview(blobUrlRef.current);
      setRemoved(false);
      onChange?.(blobUrlRef.current);
    } catch {
      setError("Gambar tidak bisa diproses. Coba gambar lain.");
    } finally {
      setBusy(false);
    }
  }

  function clear() {
    if (realRef.current) realRef.current.value = "";
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setPreview(null);
    setRemoved(true);
    setError(null);
    onChange?.(null);
  }

  const btn =
    "flex items-center justify-center gap-2 rounded-xl border border-[#d6e2ef] bg-white px-4 py-2.5 text-sm font-semibold text-[#2875b4] transition hover:bg-[#e8f3fc] disabled:opacity-50";

  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-[#102a4c]">{label}</p>

      <div className="flex items-center gap-4">
        <div className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#d6e2ef] bg-[#f4f8fd]">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt={label}
              className={`h-full w-full ${shape === "fit" ? "bg-white object-contain" : "object-cover"}`}
            />
          ) : (
            <Icon name="image" className="h-10 w-10 text-[#9fc3e6]" />
          )}
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            className={btn}
            disabled={disabled || busy}
            onClick={() => cameraRef.current?.click()}
          >
            <Icon name="camera" className="h-5 w-5" />
            Ambil foto
          </button>
          <button
            type="button"
            className={btn}
            disabled={disabled || busy}
            onClick={() => galleryRef.current?.click()}
          >
            <Icon name="image" className="h-5 w-5" />
            Pilih dari galeri
          </button>
          {preview && (
            <button
              type="button"
              onClick={clear}
              disabled={disabled || busy}
              className="text-left text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
            >
              Hapus
            </button>
          )}
        </div>
      </div>

      {busy && <p className="mt-2 text-xs text-[#7183a0]">Memproses gambar...</p>}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {/* Pemilih file: kamera (capture) dan galeri. Tidak ikut terkirim. */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        tabIndex={-1}
        onChange={onPick}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        tabIndex={-1}
        onChange={onPick}
      />
      {/* Input yang benar-benar dikirim bersama form */}
      <input ref={realRef} type="file" name="image" className="hidden" tabIndex={-1} />
      <input type="hidden" name="removeImage" value={removed ? "1" : "0"} />
    </div>
  );
}
