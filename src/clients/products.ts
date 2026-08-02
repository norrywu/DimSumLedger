import { createClient } from "@/lib/supabase/client";
import type { Product } from "@/types/products";

/**
 * Query BACA yang dijalankan dari browser. Pembagian tugasnya sama seperti
 * kategori: `src/clients/*` untuk baca, `src/servers/*` untuk tulis —
 * alasannya ditulis lengkap di `@/clients/categories`.
 *
 * `kategori:categories(nama)` adalah embed PostgREST lewat foreign key
 * `products_category_id_fkey`. Karena `category_id` NOT NULL, yang kembali
 * satu objek, bukan larik. Aliasnya dipakai supaya nama field di JSON tidak
 * ikut jamak seperti nama tabelnya.
 */
export async function getProducts(): Promise<Product[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("products")
    .select("id, nama, category_id, kategori:categories(nama)")
    .order("nama");

  // react-query membedakan sukses dan gagal lewat lemparan, bukan nilai balik.
  // Beda dengan Server Action, pesan error dari kode browser tidak diredaksi
  // Next di produksi — jadi aman dilempar apa adanya.
  if (error) {
    throw new Error(`Gagal memuat produk: ${error.message}`);
  }

  // Diratakan di sini, bukan di kolom tabel: bentuk embed adalah urusan lapisan
  // query. Kolom cukup tahu ada field `kategori_nama` bertipe string.
  return data.map(({ kategori, ...produk }) => ({
    ...produk,
    kategori_nama: kategori?.nama ?? "—",
  }));
}
