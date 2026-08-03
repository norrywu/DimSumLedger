import "server-only";

import { getAuthUser } from "@/servers/auth";
import type { AuthUser, UserRole } from "@/types/auth";

/**
 * Sama persis dengan daftar di `internal.is_pengelola()`
 * (`supabase/schemas/001_helpers.sql`). Kalau yang di SQL berubah, yang ini
 * ikut.
 */
const MANAGER_ROLES: readonly UserRole[] = ["owner", "admin"];

/**
 * Padanan TypeScript dari `internal.is_pengelola()`, untuk jalur yang tidak
 * lewat RLS.
 *
 * Fitur yang menulis lewat browser client cukup bersandar pada policy tabelnya.
 * Yang memakai `createAdminClient()` tidak punya sandaran itu sama sekali —
 * kunci rahasia menembus semua policy — jadi keputusannya harus diambil di
 * kode, dan diambil dari SESI, bukan dari argumen yang dikirim client.
 *
 * Mengembalikan `null`, bukan melempar, supaya pemanggilnya bisa menyusun
 * `{ success: false, message }` seperti kegagalan lain.
 */
export async function getManager(): Promise<AuthUser | null> {
  const user = await getAuthUser();

  // Role dibaca dari klaim `app_metadata` (lihat `getAuthUser`), yang hanya
  // bisa ditulis service role lewat trigger `internal.sync_profile_to_auth`.
  // `user_metadata` tidak bisa dipakai di sini: pengguna boleh mengubahnya
  // sendiri lewat `supabase.auth.updateUser()`.
  if (!user?.role || !MANAGER_ROLES.includes(user.role)) return null;

  return user;
}
