import type { Tables } from "@/types/supabase";

/**
 * Diturunkan dari tipe hasil generate, bukan diketik ulang. Kalau kolom di
 * `supabase/schemas/03_products.sql` berubah dan types di-regenerate,
 * TypeScript langsung menunjuk kode mana yang ikut rusak.
 *
 * `category_id` dan `kategori_nama` dua-duanya ikut karena dipakai untuk hal
 * yang berbeda: yang pertama mengisi dropdown sheet ubah, yang kedua tampil di
 * kolom tabel. Nama kategori tidak bisa menggantikan id-nya saat menyimpan.
 */
export type Product = Pick<
  Tables<"products">,
  "id" | "nama" | "category_id" | "upah_per_pcs"
> & {
  /** Diratakan dari embed `categories(nama)`; lihat `getProducts`. */
  kategori_nama: string;
};

/**
 * Kegagalan yang wajar (RLS menolak, produk sudah keburu dihapus orang lain)
 * DIKEMBALIKAN, bukan dilempar.
 *
 * Error yang dilempar dari kode server diganti pesan generik oleh Next di
 * produksi supaya detail server tidak bocor — pesan ramah dari `errorMessage`
 * tidak akan sampai ke pengguna kalau dilempar dari sana.
 */
export type ProductActionResult =
  | { success: true; message: string }
  | { success: false; message: string };
