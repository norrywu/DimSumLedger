import { createClient } from "@/lib/supabase/client";
import type { Variant } from "@/types/variants";

/**
 * Query BACA yang dijalankan dari browser. Pembagian tugasnya sama seperti
 * kategori dan produk: `src/clients/*` untuk baca, `src/servers/*` untuk tulis
 * — alasannya ditulis lengkap di `@/clients/categories`.
 *
 * `produk:products(nama)` adalah embed PostgREST lewat foreign key
 * `variants_product_id_fkey`. Karena `product_id` NOT NULL, yang kembali satu
 * objek, bukan larik. Aliasnya dipakai supaya nama field di JSON tidak ikut
 * jamak seperti nama tabelnya.
 */
export async function getVariants(): Promise<Variant[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("variants")
    .select(
      "id, product_id, nama, jumlah_pcs, harga_jual, modal_bahan, aktif, produk:products(nama)",
    );

  // react-query membedakan sukses dan gagal lewat lemparan, bukan nilai balik.
  // Beda dengan Server Action, pesan error dari kode browser tidak diredaksi
  // Next di produksi — jadi aman dilempar apa adanya.
  if (error) {
    throw new Error(`Gagal memuat varian: ${error.message}`);
  }

  // Diratakan di sini, bukan di kolom tabel: bentuk embed adalah urusan lapisan
  // query. Kolom cukup tahu ada field `produk_nama` bertipe string.
  return (
    data
      .map(({ produk, ...varian }) => ({
        ...varian,
        produk_nama: produk?.nama ?? "—",
      }))
      // Diurutkan di sini, bukan lewat `.order()`. Urutan yang dimau adalah
      // "per produk, lalu per nama varian", sedangkan
      // `.order("nama", { referencedTable: "products" })` cuma mengurutkan
      // resource yang di-embed — baris induknya tidak ikut tersusun.
      .sort(
        (a, b) =>
          a.produk_nama.localeCompare(b.produk_nama, "id") ||
          a.nama.localeCompare(b.nama, "id"),
      )
  );
}
