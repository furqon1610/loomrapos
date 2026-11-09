import Link from "next/link";
import { requireActiveOwner } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";
import { fetchAllProducts, fetchCategoryNames } from "@/lib/pos-data";
import { LOW_STOCK_THRESHOLD } from "@/lib/pos";
import { formatRupiah } from "@/lib/billing";
import { Icon } from "@/components/icons";
import DeleteProductButton from "@/components/owner/DeleteProductButton";
import { deleteProduct } from "./actions";

const card = "rounded-2xl bg-white shadow-[0_15px_50px_rgba(51,133,200,0.08)]";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string }>;
}) {
  await requireActiveOwner();
  const { q = "", cat = "" } = await searchParams;

  const supabase = await createClient();
  const [all, categories] = await Promise.all([
    fetchAllProducts(supabase),
    fetchCategoryNames(supabase),
  ]);

  const query = q.trim().toLowerCase();
  const products = all.filter(
    (p) => (!cat || p.category === cat) && (!query || p.name.toLowerCase().includes(query)),
  );

  const chip = (active: boolean) =>
    `rounded-full px-4 py-2 text-xs font-semibold transition ${
      active ? "bg-[#3385c8] text-white" : "bg-white text-[#4a5f7d] hover:bg-[#e8f3fc]"
    }`;
  const hrefFor = (c: string) =>
    `/dashboard/produk?${new URLSearchParams({ ...(c ? { cat: c } : {}), ...(q ? { q } : {}) })}`;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Produk</h1>
          <p className="mt-1 text-sm text-[#7183a0]">{all.length} produk terdaftar.</p>
        </div>
        <Link
          href="/dashboard/produk/baru"
          className="flex items-center gap-2 rounded-xl bg-[#3385c8] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2875b4]"
        >
          <Icon name="plus" className="h-5 w-5" />
          Tambah Produk
        </Link>
      </div>

      <form action="/dashboard/produk" className="flex gap-2">
        {cat && <input type="hidden" name="cat" value={cat} />}
        <div className="flex flex-1 items-center gap-3 rounded-xl border border-[#d6e2ef] bg-white px-4">
          <Icon name="search" className="h-5 w-5 text-[#7890ae]" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Cari nama produk"
            className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-[#9aabc0]"
          />
        </div>
        <button className="rounded-xl bg-white px-5 text-sm font-semibold text-[#2875b4] ring-1 ring-[#d6e2ef] transition hover:bg-[#e8f3fc]">
          Cari
        </button>
      </form>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Link href={hrefFor("")} className={chip(!cat)}>
            Semua
          </Link>
          {categories.map((c) => (
            <Link key={c} href={hrefFor(c)} className={chip(cat === c)}>
              {c}
            </Link>
          ))}
        </div>
      )}

      <div className={`${card} p-2 sm:p-4`}>
        {products.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8f3fc] text-[#3385c8]">
              <Icon name="box" className="h-7 w-7" />
            </span>
            <p className="font-semibold">
              {all.length === 0 ? "Belum ada produk" : "Produk tidak ditemukan"}
            </p>
            <p className="max-w-xs text-sm text-[#7183a0]">
              {all.length === 0
                ? "Tambahkan produk pertama Anda supaya bisa dipakai di kasir."
                : "Coba kata kunci atau kategori lain."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-[#f4f8fd] text-xs font-semibold text-[#5b6f8e]">
                <tr>
                  <th className="px-3 py-3">Produk</th>
                  <th className="px-3 py-3">Kategori</th>
                  <th className="px-3 py-3 text-right">Harga</th>
                  <th className="px-3 py-3 text-right">Stok</th>
                  <th className="px-3 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eef2f7]">
                {products.map((p) => (
                  <tr key={p.id}>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#f0f6fc] text-[#9aabc0]">
                          {p.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.image_url} alt="" loading="lazy" className="h-full w-full object-cover" />
                          ) : (
                            <Icon name="box" className="h-5 w-5" />
                          )}
                        </span>
                        <span className="font-semibold">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-[#7183a0]">{p.category ?? "-"}</td>
                    <td className="px-3 py-3 text-right">{formatRupiah(p.price)}</td>
                    <td className="px-3 py-3 text-right">
                      {!p.track_stock ? (
                        <span className="text-[#7183a0]">—</span>
                      ) : p.stock === 0 ? (
                        <span className="rounded-md bg-red-50 px-2 py-1 text-xs font-semibold text-red-600">
                          Habis
                        </span>
                      ) : p.stock <= LOW_STOCK_THRESHOLD ? (
                        <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
                          {p.stock} (menipis)
                        </span>
                      ) : (
                        p.stock
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/dashboard/produk/${p.id}`}
                          aria-label={`Edit ${p.name}`}
                          title="Edit"
                          className="rounded-lg p-2 text-[#7183a0] transition hover:bg-[#e8f3fc] hover:text-[#2875b4]"
                        >
                          <Icon name="pencil" className="h-[18px] w-[18px]" />
                        </Link>
                        <DeleteProductButton id={p.id} name={p.name} action={deleteProduct} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
