import type { Tables } from "@/types/supabase";

/**
 * Diturunkan dari tipe hasil generate, bukan diketik ulang. Kalau kolom di
 * `supabase/schemas/02_packagings.sql` berubah dan types di-regenerate,
 * TypeScript langsung menunjuk kode mana yang ikut rusak.
 *
 * Tanpa perataan embed seperti `Variant`: tabel ini tidak punya foreign key
 * sama sekali. Kaitannya ke katalog many-to-many lewat `variant_packagings`,
 * jadi satu kemasan dipakai bersama lintas produk dan tidak dimiliki siapa pun.
 */
export type Packaging = Pick<
  Tables<"packagings">,
  "id" | "nama" | "harga_satuan"
>;

/**
 * Kegagalan yang wajar (nama kembar, RLS menolak, kemasan masih dipakai varian)
 * DIKEMBALIKAN, bukan dilempar.
 *
 * Error yang dilempar dari kode server diganti pesan generik oleh Next di
 * produksi supaya detail server tidak bocor — pesan ramah dari `errorMessage`
 * tidak akan sampai ke pengguna kalau dilempar dari sana.
 */
export type PackagingActionResult =
  | { success: true; message: string }
  | { success: false; message: string };
