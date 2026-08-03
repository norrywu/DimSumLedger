import type { UserRole } from "@/types/auth";
import type { Database } from "@/types/supabase";

/**
 * Bentuk baris dari RPC `daftar_pengguna`, bukan `Tables<"profiles">`: email
 * dan waktu login terakhir tinggal di `auth.users`, yang tidak ikut
 * ter-generate. Tetap diturunkan dari tipe hasil generate dengan alasan yang
 * sama seperti `Category` — kalau `RETURNS TABLE` di
 * `supabase/schemas/08_daftar_pengguna.sql` berubah, TypeScript yang menunjuk
 * kode mana yang ikut rusak.
 */
type UserRow =
  Database["public"]["Functions"]["daftar_pengguna"]["Returns"][number];

/**
 * Dua kolom dipersempit/dilonggarkan dari hasil generate:
 *
 * - `role` jadi `UserRole`. CHECK constraint tidak terbawa ke tipe hasil
 *   generate, jadi di sana ia cuma `string`.
 * - `last_sign_in_at` jadi nullable. Codegen tidak tahu nullability kolom
 *   `RETURNS TABLE`, padahal akun yang belum pernah login memang NULL di sana.
 */
export type User = Omit<UserRow, "role" | "last_sign_in_at"> & {
  role: UserRole;
  last_sign_in_at: string | null;
};

/**
 * Kegagalan yang wajar (email kembar, sesi habis, hapus akun sendiri)
 * DIKEMBALIKAN, bukan dilempar.
 *
 * Error yang dilempar dari kode server diganti pesan generik oleh Next di
 * produksi supaya detail server tidak bocor — pesan ramah dari `errorMessage`
 * tidak akan sampai ke pengguna kalau dilempar dari sana.
 */
export type UserActionResult =
  | { success: true; message: string }
  | { success: false; message: string };
