import type { Tables } from "@/types/supabase";

/**
 * Diturunkan dari tipe hasil generate, bukan diketik ulang. Kalau kolom di
 * `supabase/schemas/01_categories.sql` berubah dan types di-regenerate,
 * TypeScript langsung menunjuk kode mana yang ikut rusak.
 */
export type Category = Pick<Tables<"categories">, "id" | "nama">;

/**
 * Kegagalan yang wajar (nama kembar, RLS menolak, kategori masih dipakai)
 * DIKEMBALIKAN, bukan dilempar.
 *
 * Error yang dilempar dari kode server diganti pesan generik oleh Next di
 * produksi supaya detail server tidak bocor — pesan ramah dari `pesanError`
 * tidak akan sampai ke pengguna kalau dilempar dari sana.
 */
export type CategoryActionResult =
  | { success: true; message: string }
  | { success: false; message: string };
