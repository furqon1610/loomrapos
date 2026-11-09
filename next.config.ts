import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Hanya berlaku saat `npm run dev`: izinkan membuka server dev dari HP lewat jaringan WiFi
  // (mis. http://192.168.0.101:3000) atau lewat tunnel. Tanpa ini, Next.js memblokir file
  // dev dari alamat selain localhost, sehingga halaman tampil tetapi tombolnya tidak hidup.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "*.trycloudflare.com", "*.ngrok-free.app", "*.ngrok.app"],
  experimental: {
    // Foto bukti pembayaran / QRIS dari HP sering > 1 MB (batas default server action).
    serverActions: { bodySizeLimit: "6mb" },
  },
};

export default nextConfig;
