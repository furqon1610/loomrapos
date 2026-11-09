import Image from "next/image";
import type { ReactNode } from "react";

export default function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7fbff] px-4 py-8 sm:px-6">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#dceeff] opacity-70 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 h-80 w-80 rounded-full bg-[#dceeff] opacity-70 blur-2xl" />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-lg flex-col items-center justify-center">
        <div className="mb-7 text-center">
          <Image
            src="/logo.png"
            alt="LoomraPOS Logo"
            width={90}
            height={90}
            className="mx-auto h-auto w-20 sm:w-24"
            priority
          />
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#102a4c] sm:text-4xl">
            Loomra<span className="text-[#3385c8]">POS</span>
          </h1>
          <h2 className="mt-7 text-2xl font-bold text-[#102a4c] sm:text-3xl">{title}</h2>
          <p className="mt-3 text-sm leading-6 text-[#7183a0] sm:text-base">{subtitle}</p>
        </div>

        <div className="w-full rounded-2xl bg-white p-6 shadow-[0_15px_50px_rgba(51,133,200,0.10)] sm:p-8">
          {children}
        </div>
      </div>
    </main>
  );
}
