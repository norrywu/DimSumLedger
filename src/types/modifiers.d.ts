import type { Tables } from "@/types/supabase";

/**
 * Diturunkan dari tipe hasil generate, bukan diketik ulang. Kalau kolom di
 * `supabase/schemas/06_modifiers.sql` berubah dan types di-regenerate,
 * TypeScript langsung menunjuk kode mana yang ikut rusak.
 *
 * Sama datar seperti `Packaging`: tabel ini tidak punya foreign key sama
 * sekali, jadi tidak ada embed yang perlu diratakan.
 */
export type Modifier = Pick<Tables<"modifiers">, "id" | "nama" | "price">;

/**
 * Kegagalan yang wajar (nama kembar, RLS menolak) DIKEMBALIKAN, bukan dilempar.
 *
 * Error yang dilempar dari kode server diganti pesan generik oleh Next di
 * produksi supaya detail server tidak bocor — pesan ramah dari `errorMessage`
 * tidak akan sampai ke pengguna kalau dilempar dari sana.
 */
export type ModifierActionResult =
  | { success: true; message: string }
  | { success: false; message: string };
