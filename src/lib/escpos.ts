import type { Section } from "@/lib/receipt-layout";

/** Gambar monokrom siap cetak: 1 bit per titik (1 = hitam), baris demi baris. */
export type Bitmap = { bytesPerRow: number; height: number; data: Uint8Array };

const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

const SYMBOLS: Record<string, string> = {
  "–": "-", "—": "-", "·": "-", "•": "*", "×": "x", "’": "'", "‘": "'", "“": '"', "”": '"', "…": "...", "\u00a0": " ",
};

/** Printer thermal murah hanya pasti bisa ASCII: aksen dilepas, emoji dan simbol lain dibuang. */
export function toPrintable(text: string) {
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[–—·•×’‘“”…\u00a0]/g, (c) => SYMBOLS[c] ?? "")
    .replace(/[^\x20-\x7E\n]/g, "");
}

/** Bungkus teks per kata sesuai lebar kolom; kata yang lebih panjang dari lebar dipotong. */
export function wrapText(text: string, width: number): string[] {
  const lines: string[] = [];
  for (const paragraph of toPrintable(text).split("\n")) {
    let line = "";
    for (const word of paragraph.split(/ +/).filter(Boolean)) {
      let w = word;
      while (w.length > width) {
        if (line) {
          lines.push(line);
          line = "";
        }
        lines.push(w.slice(0, width));
        w = w.slice(width);
      }
      if (!line) line = w;
      else if (line.length + 1 + w.length <= width) line += ` ${w}`;
      else {
        lines.push(line);
        line = w;
      }
    }
    lines.push(line);
  }
  return lines;
}

/** Kiri-kanan dalam satu baris; kalau tidak muat, kiri dibungkus lalu kanan di baris sendiri. */
export function rowLines(left: string, right: string, width: number): string[] {
  const l = toPrintable(left).replace(/\n/g, " ");
  const r = toPrintable(right).replace(/\n/g, " ");
  if (l.length + 1 + r.length <= width) return [l + " ".repeat(width - l.length - r.length) + r];
  return [...wrapText(l, width), " ".repeat(Math.max(0, width - r.length)) + r.slice(-width)];
}

/**
 * Ubah piksel RGBA menjadi bitmap hitam-putih dengan dithering Floyd–Steinberg.
 * Lebar harus kelipatan 8. Transparan dianggap putih.
 */
export function toMonochrome(rgba: ArrayLike<number>, width: number, height: number): Bitmap {
  if (width % 8 !== 0) throw new Error("Lebar bitmap harus kelipatan 8");
  const lum = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const a = rgba[i * 4 + 3] / 255;
    const y = 0.299 * rgba[i * 4] + 0.587 * rgba[i * 4 + 1] + 0.114 * rgba[i * 4 + 2];
    lum[i] = y * a + 255 * (1 - a);
  }

  const bytesPerRow = width / 8;
  const data = new Uint8Array(bytesPerRow * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const old = lum[i];
      const black = old < 128;
      const err = old - (black ? 0 : 255);
      if (x + 1 < width) lum[i + 1] += (err * 7) / 16;
      if (y + 1 < height) {
        if (x > 0) lum[i + width - 1] += (err * 3) / 16;
        lum[i + width] += (err * 5) / 16;
        if (x + 1 < width) lum[i + width + 1] += err / 16;
      }
      if (black) data[y * bytesPerRow + (x >> 3)] |= 0x80 >> (x & 7);
    }
  }
  return { bytesPerRow, height, data };
}

class Out {
  private parts: number[] = [];
  bytes(...b: number[]) {
    this.parts.push(...b);
  }
  text(s: string) {
    for (let i = 0; i < s.length; i++) this.parts.push(s.charCodeAt(i) & 0x7f);
  }
  line(s: string) {
    this.text(s);
    this.parts.push(LF);
  }
  raw(data: Uint8Array) {
    for (let i = 0; i < data.length; i++) this.parts.push(data[i]);
  }
  done() {
    return Uint8Array.from(this.parts);
  }
}

export type EncodeOptions = {
  /** Jumlah karakter per baris: 32 untuk kertas 58 mm, 48 untuk 80 mm. */
  widthChars: number;
  logo?: Bitmap | null;
  /** Potong kertas di akhir (printer tanpa pemotong mengabaikannya). */
  cut?: boolean;
};

/** Susun struk menjadi perintah ESC/POS untuk printer thermal. */
export function encodeReceipt(sections: Section[], opts: EncodeOptions): Uint8Array {
  const { widthChars: width } = opts;
  const out = new Out();
  out.bytes(ESC, 0x40); // reset printer

  const align = (n: 0 | 1 | 2) => out.bytes(ESC, 0x61, n);
  const bold = (on: boolean) => out.bytes(ESC, 0x45, on ? 1 : 0);

  sections.forEach((section, si) => {
    if (si > 0) {
      align(0);
      out.line("-".repeat(width));
    }

    for (const b of section) {
      switch (b.kind) {
        case "logo": {
          if (!opts.logo) break;
          const { bytesPerRow, height, data } = opts.logo;
          align(1);
          // Dikirim per blok baris supaya tidak melampaui buffer printer murah.
          for (let y = 0; y < height; y += 64) {
            const rows = Math.min(64, height - y);
            out.bytes(GS, 0x76, 0x30, 0, bytesPerRow & 0xff, bytesPerRow >> 8, rows & 0xff, rows >> 8);
            out.raw(data.subarray(y * bytesPerRow, (y + rows) * bytesPerRow));
          }
          align(0);
          break;
        }
        case "title":
          align(1);
          bold(true);
          out.bytes(GS, 0x21, 0x01); // tinggi 2x
          for (const l of wrapText(b.text, width)) out.line(l);
          out.bytes(GS, 0x21, 0x00);
          bold(false);
          align(0);
          break;
        case "center":
          align(1);
          for (const l of wrapText(b.text, width)) out.line(l);
          align(0);
          break;
        case "text":
          if (b.gapBefore) out.bytes(LF);
          for (const l of wrapText(b.text, width)) out.line(l);
          break;
        case "row":
          if (b.bold) bold(true);
          for (const l of rowLines(b.left, b.right, width)) out.line(l);
          if (b.bold) bold(false);
          break;
      }
    }
  });

  out.bytes(ESC, 0x64, 4); // dorong kertas 4 baris
  if (opts.cut) out.bytes(GS, 0x56, 0x42, 0x00); // potong sebagian
  return out.done();
}
