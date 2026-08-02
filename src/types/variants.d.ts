import type { Tables } from "@/types/supabase";

/**
 * Diturunkan dari tipe hasil generate, bukan diketik ulang. Kalau kolom di
 * `supabase/schemas/04_variants.sql` berubah dan types di-regenerate,
 * TypeScript langsung menunjuk kode mana yang ikut rusak.
 *
 * `product_id` dan `produk_nama` dua-duanya ikut karena dipakai untuk hal yang
 * berbeda: yang pertama mengisi dropdown sheet ubah dan jadi dasar filter
 * produk, yang kedua tampil di kolom tabel. Nama produk tidak bisa
 * menggantikan id-nya saat menyimpan.
 *
 * `created_at` sengaja tidak ikut: tidak ada kolom tabel maupun isian form yang
 * memakainya.
 */
export type Variant = Pick<
  Tables<"variants">,
  "id" | "product_id" | "nama" | "jumlah_pcs" | "harga_jual" | "modal_bahan" | "aktif"
> & {
  /** Diratakan dari embed `products(nama)`; lihat `getVariants`. */
  produk_nama: string;
  /**
   * Kemasan yang dipakai varian ini, diratakan dari embed
   * `variant_packagings(… packagings(…))`. Selalu berisi minimal satu —
   * dijamin `public.simpan_varian`, bukan cuma oleh form.
   *
   * `harga_satuan` ikut dibawa supaya sheet ubah bisa menghitung ulang modal
   * secara langsung tanpa query kedua.
   */
  kemasan: VariantPackaging[];
  /** Σ(harga_satuan × jumlah). Dihitung, TIDAK disimpan — lihat `getVariants`. */
  modal_kemasan: number;
  /** `modal_bahan + modal_kemasan`. */
  modal_total: number;
  /** `harga_jual − modal_total`. Negatif berarti dijual di bawah modal. */
  margin: number;
};

/** Satu baris `variant_packagings` yang sudah digabung dengan master kemasannya. */
export type VariantPackaging = {
  packaging_id: string;
  nama: string;
  harga_satuan: number;
  jumlah: number;
};

/**
 * Kegagalan yang wajar (RLS menolak, produknya sudah keburu dihapus orang lain)
 * DIKEMBALIKAN, bukan dilempar.
 *
 * Error yang dilempar dari kode server diganti pesan generik oleh Next di
 * produksi supaya detail server tidak bocor — pesan ramah dari `errorMessage`
 * tidak akan sampai ke pengguna kalau dilempar dari sana.
 */
export type VariantActionResult =
  | { success: true; message: string }
  | { success: false; message: string };
