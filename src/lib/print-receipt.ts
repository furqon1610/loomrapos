"use client";

import { encodeReceipt, toMonochrome, type Bitmap } from "@/lib/escpos";
import { printBytes } from "@/lib/bluetooth-printer";
import { buildReceiptModel, type ReceiptData, type ReceiptStore, type Section } from "@/lib/receipt-layout";
import type { ReceiptSettings } from "@/lib/receipt";

const DOTS = { 58: 384, 80: 576 } as const;
const COLS = { 58: 32, 80: 48 } as const;

const logoCache = new Map<string, Bitmap>();

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("logo"));
    img.src = url;
  });
}

/** Logo diubah jadi bitmap hitam-putih selebar sizePct% dari lebar kertas. */
async function loadLogoBitmap(url: string, paperDots: number, sizePct: number): Promise<Bitmap> {
  const width = Math.max(8, Math.floor((paperDots * sizePct) / 100 / 8) * 8);
  const key = `${url}|${width}`;
  const cached = logoCache.get(key);
  if (cached) return cached;

  const img = await loadImage(url);
  const height = Math.min(480, Math.max(1, Math.round((img.naturalHeight * width) / img.naturalWidth)));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  const bitmap = toMonochrome(ctx.getImageData(0, 0, width, height).data, width, height);
  logoCache.set(key, bitmap);
  return bitmap;
}

async function send(sections: Section[], paper: 58 | 80) {
  const logoBlock = sections.flat().find((b) => b.kind === "logo");
  let logo: Bitmap | null = null;
  if (logoBlock && logoBlock.kind === "logo") {
    try {
      logo = await loadLogoBitmap(logoBlock.url, DOTS[paper], logoBlock.sizePct);
    } catch {
      logo = null; // logo gagal dimuat: struk tetap dicetak tanpa logo
    }
  }
  await printBytes(encodeReceipt(sections, { widthChars: COLS[paper], logo, cut: paper === 80 }));
}

export async function printReceipt(store: ReceiptStore, settings: ReceiptSettings, data: ReceiptData) {
  await send(buildReceiptModel(store, settings, data), settings.paper_width);
}

export async function printTest(paper: 58 | 80) {
  const cols = COLS[paper];
  await send(
    [
      [
        { kind: "title", text: "TES PRINTER" },
        { kind: "center", text: "LoomraPOS" },
      ],
      [
        { kind: "row", left: "Kertas", right: `${paper} mm` },
        { kind: "row", left: "Lebar", right: `${cols} karakter` },
        { kind: "text", text: "1234567890".repeat(5).slice(0, cols) },
      ],
      [{ kind: "center", text: "Kalau tulisan ini rapi dan tidak terpotong, printer siap dipakai." }],
    ],
    paper,
  );
}
