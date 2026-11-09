import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-[#102a4c]">

      {/* ================= NAVBAR ================= */}
      <header className="sticky top-0 z-50 border-b border-[#e5eef7] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="LoomraPOS"
              width={42}
              height={42}
              className="h-9 w-9"
              priority
            />

            <span className="text-xl font-bold">
              Loomra<span className="text-[#3385c8]">POS</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
            <a href="#fitur" className="hover:text-[#3385c8]">
              Fitur
            </a>

            <a href="#harga" className="hover:text-[#3385c8]">
              Harga
            </a>

            <a href="#cara-kerja" className="hover:text-[#3385c8]">
              Cara Kerja
            </a>

            <a href="#faq" className="hover:text-[#3385c8]">
              FAQ
            </a>
          </nav>

          {/* Desktop Buttons */}
          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-semibold text-[#3385c8] hover:bg-[#f1f8fe]"
            >
              Login
            </Link>

            <Link
              href="/register"
              className="rounded-lg bg-[#3385c8] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2875b4]"
            >
              Buat Akun
            </Link>
          </div>

          {/* Mobile Menu */}
          <details className="relative md:hidden">
            <summary
              className="flex cursor-pointer list-none items-center rounded-lg p-2 text-2xl text-[#102a4c] [&::-webkit-details-marker]:hidden"
              aria-label="Buka menu"
            >
              ☰
            </summary>

            <div className="absolute right-0 top-12 w-56 rounded-2xl border border-[#e5eef7] bg-white p-3 shadow-xl">
              <a href="#fitur" className="block rounded-lg px-4 py-3 text-sm font-medium hover:bg-[#f1f8fe]">
                Fitur
              </a>
              <a href="#harga" className="block rounded-lg px-4 py-3 text-sm font-medium hover:bg-[#f1f8fe]">
                Harga
              </a>
              <a href="#cara-kerja" className="block rounded-lg px-4 py-3 text-sm font-medium hover:bg-[#f1f8fe]">
                Cara Kerja
              </a>
              <a href="#faq" className="block rounded-lg px-4 py-3 text-sm font-medium hover:bg-[#f1f8fe]">
                FAQ
              </a>
              <div className="my-2 h-px bg-[#e5eef7]" />
              <Link href="/login" className="block rounded-lg px-4 py-3 text-sm font-semibold text-[#3385c8] hover:bg-[#f1f8fe]">
                Login
              </Link>
              <Link
                href="/register"
                className="mt-1 block rounded-lg bg-[#3385c8] px-4 py-3 text-center text-sm font-semibold text-white"
              >
                Buat Akun
              </Link>
            </div>
          </details>
        </div>
      </header>

      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden bg-[#f7fbff]">
        <div className="absolute -left-32 -top-32 h-72 w-72 rounded-full bg-[#dceeff] blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-[#dceeff] blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-5 py-20 text-center sm:py-24 md:py-32">

          <div className="mx-auto max-w-3xl">

            <span className="inline-flex rounded-full bg-[#e8f4fd] px-4 py-2 text-xs font-semibold text-[#3385c8] sm:text-sm">
              Coba gratis 14 hari, tanpa kartu kredit
            </span>

            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl">
              Kelola Usaha Lebih Mudah dengan{" "}
              <span className="text-[#3385c8]">
                LoomraPOS
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#7183a0] sm:text-lg sm:leading-8">
              Catat transaksi, kelola produk berfoto, cetak struk ke printer
              Bluetooth, dan pantau laporan penjualan dari HP atau komputer.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">

              <Link
                href="/register"
                className="rounded-xl bg-[#3385c8] px-7 py-4 font-semibold text-white shadow-lg shadow-[#3385c8]/20 transition hover:bg-[#2875b4]"
              >
                Coba Gratis 14 Hari →
              </Link>

              <Link
                href="/login"
                className="rounded-xl border border-[#d6e2ef] bg-white px-7 py-4 font-semibold text-[#102a4c] transition hover:bg-[#f7fbff]"
              >
                Login
              </Link>

            </div>
          </div>
        </div>
      </section>

      {/* ================= FITUR ================= */}
      <section id="fitur" className="px-5 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl">

          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-semibold text-[#3385c8]">
              FITUR
            </span>

            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              Semua yang dibutuhkan untuk berjualan
            </h2>

            <p className="mt-4 text-[#7183a0]">
              Dari kasir sampai laporan, dirancang agar mudah dipakai
              sehari-hari.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

            <Feature
              icon="⚡"
              title="Kasir Cepat"
              description="Pilih produk berfoto, atur jumlah, pilih metode pembayaran, selesai dalam hitungan detik."
            />

            <Feature
              icon="📦"
              title="Produk, Foto & Stok"
              description="Tambah produk dengan foto dari kamera atau galeri, lengkap dengan kategori, harga, dan stok."
            />

            <Feature
              icon="📊"
              title="Laporan Penjualan"
              description="Laporan harian, mingguan, dan bulanan, lengkap dengan produk terlaris dan metode pembayaran."
            />

            <Feature
              icon="🧾"
              title="Struk & Printer Bluetooth"
              description="Atur logo, isi, dan footer struk sesuai tokomu, lalu cetak langsung ke printer Bluetooth."
            />

            <Feature
              icon="👥"
              title="Karyawan & Absensi"
              description="Catat semua karyawan tokomu. Mereka absen dengan PIN di perangkat toko, dan hingga 3 orang punya akun kasir sendiri."
              pro
            />

            <Feature
              icon="📈"
              title="Monitoring Karyawan"
              description="Pantau transaksi dan total penjualan tiap kasir, serta kehadiran karyawan."
              pro
            />

          </div>
        </div>
      </section>

      {/* ================= CARA KERJA ================= */}
      <section
        id="cara-kerja"
        className="bg-[#f7fbff] px-5 py-20 sm:py-24"
      >
        <div className="mx-auto max-w-5xl text-center">

          <span className="text-sm font-semibold text-[#3385c8]">
            CARA KERJA
          </span>

          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
            Mulai dalam beberapa langkah
          </h2>

          <div className="mt-12 grid gap-6 md:grid-cols-3">

            <Step
              number="1"
              title="Buat Akun & Pilih Paket"
              description="Daftar, pilih Basic atau Pro, dan langsung dapat masa percobaan 14 hari."
            />

            <Step
              number="2"
              title="Atur Toko & Produk"
              description="Isi info toko, unggah logo, dan tambahkan produk beserta fotonya."
            />

            <Step
              number="3"
              title="Mulai Berjualan"
              description="Catat transaksi di kasir, cetak struk, dan pantau laporan penjualan."
            />

          </div>
        </div>
      </section>

      {/* ================= HARGA ================= */}
      <section id="harga" className="px-5 py-20 sm:py-24">
        <div className="mx-auto max-w-5xl">

          <div className="text-center">
            <span className="text-sm font-semibold text-[#3385c8]">
              HARGA
            </span>

            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              Pilih paket sesuai kebutuhan
            </h2>

            <p className="mt-4 text-[#7183a0]">
              Gratis 14 hari untuk kedua paket. Bayar setelah masa percobaan berakhir.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2">

            {/* BASIC */}
            <Pricing
              name="Basic"
              price="99.000"
              description="Untuk usaha yang butuh kasir sederhana dengan laporan penjualan."
              features={[
                "Kasir dan struk",
                "Produk dengan foto, kategori, dan stok",
                "Laporan harian, mingguan, dan bulanan",
                "Produk terlaris dan metode pembayaran",
                "Struk custom: logo, isi, dan footer",
                "Printer Bluetooth",
              ]}
              href="/register?plan=basic"
            />

            {/* PRO */}
            <Pricing
              name="Pro"
              price="299.000"
              description="Untuk usaha yang punya karyawan dan ingin memantau operasionalnya."
              features={[
                "Semua fitur Basic",
                "Daftar karyawan lengkap dengan detailnya",
                "Absensi semua karyawan dengan PIN (clock-in dan clock-out)",
                "Hingga 3 akun kasir (username dan password sendiri)",
                "Laporan per karyawan",
                "Monitoring transaksi dan kehadiran",
              ]}
              href="/register?plan=pro"
              popular
            />

          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="px-5 py-20">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl bg-[#3385c8] px-6 py-14 text-center text-white sm:px-10">

          <h2 className="text-3xl font-bold sm:text-4xl">
            Siap mulai menggunakan LoomraPOS?
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-white/80 sm:text-base">
            Coba gratis 14 hari. Tanpa kartu kredit, pembayaran baru
            diminta setelah masa percobaan berakhir.
          </p>

          <Link
            href="/register"
            className="mt-8 inline-block rounded-xl bg-white px-7 py-4 font-semibold text-[#3385c8] transition hover:bg-[#f3f8fc]"
          >
            Coba Gratis 14 Hari →
          </Link>

        </div>
      </section>

      {/* ================= FAQ ================= */}
      <section id="faq" className="px-5 py-20 sm:py-24">
        <div className="mx-auto max-w-3xl">

          <div className="text-center">
            <span className="text-sm font-semibold text-[#3385c8]">
              FAQ
            </span>

            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              Pertanyaan umum
            </h2>
          </div>

          <div className="mt-10 space-y-4">

            <Faq q="Apa itu LoomraPOS?">
              LoomraPOS adalah aplikasi kasir online untuk mencatat transaksi,
              mengelola produk, mencetak struk, dan melihat laporan penjualan.
            </Faq>

            <Faq q="Apakah ada masa percobaan?">
              Ada. Setiap toko baru mendapat masa percobaan gratis 14 hari
              untuk paket yang dipilih, tanpa kartu kredit.
            </Faq>

            <Faq q="Apakah bisa digunakan dari HP?">
              Ya. LoomraPOS dipakai lewat browser, jadi bisa dari HP, tablet,
              maupun komputer tanpa perlu memasang aplikasi.
            </Faq>

            <Faq q="Printer apa yang didukung?">
              Printer struk thermal 58 mm atau 80 mm yang mendukung Bluetooth LE.
              Cetak langsung lewat Bluetooth memerlukan browser Chrome di Android
              atau komputer. Di perangkat lain, struk tetap bisa dicetak lewat
              dialog cetak browser.
            </Faq>

            <Faq q="Bagaimana cara berlangganan dan membayar?">
              Pilih paket di menu Langganan, bayar lewat QRIS sesuai nominal yang
              tertera, lalu unggah bukti pembayaran. Setelah diverifikasi oleh
              admin, paket langsung aktif.
            </Faq>

            <Faq q="Apa yang terjadi kalau masa percobaan habis?">
              Akun akan dikunci sampai pembayaran terverifikasi. Selama
              pembayaranmu masih dalam proses verifikasi, akun tetap bisa dipakai.
            </Faq>

            <Faq q="Bisakah mengganti paket?">
              Bisa. Kamu dapat upgrade ke Pro kapan saja dari menu Langganan, dan
              sisa masa percobaan atau masa aktif tidak hangus. Pro bisa turun ke
              Basic saat masa aktifnya berakhir.
            </Faq>

          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-[#e5eef7] px-5 py-10">

        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">

          <div>
            <p className="font-bold">
              Loomra<span className="text-[#3385c8]">POS</span>
            </p>

            <p className="mt-1 text-xs text-[#8b9bb0]">
              Solusi Kasir Modern untuk Usaha Anda
            </p>
          </div>

          <p className="text-xs text-[#8b9bb0]">
            © 2026 LoomraPOS. All rights reserved.
          </p>

        </div>

      </footer>

    </main>
  );
}

/* ================= COMPONENTS ================= */

function Feature({
  icon,
  title,
  description,
  pro = false,
}: {
  icon: string;
  title: string;
  description: string;
  pro?: boolean;
}) {
  return (
    <div className="relative rounded-2xl border border-[#e2ebf4] bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg">
      {pro && (
        <span className="absolute right-5 top-5 rounded-full bg-[#e8f4fd] px-3 py-1 text-xs font-semibold text-[#3385c8]">
          Pro
        </span>
      )}

      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#e8f4fd] text-2xl">
        {icon}
      </div>

      <h3 className="mt-5 text-lg font-bold">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-[#7183a0]">
        {description}
      </p>
    </div>
  );
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="rounded-xl border border-[#dce5ef] p-5">
      <summary className="cursor-pointer font-semibold">
        {q}
      </summary>

      <p className="mt-3 text-sm leading-6 text-[#7183a0]">
        {children}
      </p>
    </details>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#3385c8] font-bold text-white">
        {number}
      </div>

      <h3 className="mt-5 text-lg font-bold">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-[#7183a0]">
        {description}
      </p>
    </div>
  );
}

function Pricing({
  name,
  price,
  description,
  features,
  href,
  popular = false,
}: {
  name: string;
  price: string;
  description: string;
  features: string[];
  href: string;
  popular?: boolean;
}) {
  return (
    <div
      className={`relative rounded-2xl border p-6 sm:p-8 ${
        popular
          ? "border-[#3385c8] shadow-lg shadow-[#3385c8]/10"
          : "border-[#e2ebf4]"
      }`}
    >
      {popular && (
        <span className="absolute right-5 top-5 rounded-full bg-[#e8f4fd] px-3 py-1 text-xs font-semibold text-[#3385c8]">
          Paling lengkap
        </span>
      )}

      <h3 className="text-xl font-bold">
        {name}
      </h3>

      <div className="mt-5">
        <span className="text-3xl font-bold">
          Rp{price}
        </span>

        <span className="text-sm text-[#8b9bb0]">
          /bulan
        </span>

        <p className="mt-1 text-xs font-semibold text-[#3385c8]">
          Gratis 14 hari pertama
        </p>
      </div>

      <p className="mt-3 text-sm leading-6 text-[#7183a0]">
        {description}
      </p>

      <div className="my-6 h-px bg-[#e5eef7]" />

      <ul className="space-y-3">
        {features.map((feature) => (
          <li
            key={feature}
            className="flex items-center gap-3 text-sm"
          >
            <span className="text-[#3385c8]">✓</span>
            {feature}
          </li>
        ))}
      </ul>

      <Link
        href={href}
        className={`mt-8 block rounded-xl py-3.5 text-center text-sm font-semibold transition ${
          popular
            ? "bg-[#3385c8] text-white hover:bg-[#2875b4]"
            : "border border-[#d6e2ef] text-[#3385c8] hover:bg-[#f7fbff]"
        }`}
      >
        Coba Gratis 14 Hari
      </Link>
    </div>
  );
}