/** Bentuk state yang dikembalikan Server Action login ke `useActionState`. */
export type LoginState = {
  message: string;
  fieldErrors?: Partial<Record<"email" | "password", string[]>>;
};

/**
 * Nilai sah `profiles.role`. Ditulis tangan karena CHECK constraint tidak
 * terbawa ke tipe hasil generate — `@/types/supabase` hanya memberi
 * `role: string`. Jaga tetap selaras dengan
 * `supabase/schemas/000_profile.sql`.
 */
export type UserRole = "admin" | "cashier";

/**
 * Hanya service role yang bisa menulisnya (lewat trigger
 * `internal.sync_profile_to_auth`), jadi aman dipakai untuk hak akses.
 */
export type AppMetadata = {
  provider?: string;
  providers?: string[];
  role?: UserRole;
};

/**
 * Bentuk klaim mentah `user_metadata` di dalam JWT. Bisa diubah user sendiri
 * lewat `supabase.auth.updateUser()`, jadi JANGAN dipakai untuk keputusan hak
 * akses.
 *
 * Berawalan `Supabase` supaya tidak tertukar dengan `UserMetadata` di
 * `@/types/metadata`, yang merupakan bentuk user untuk tampilan sidebar.
 */
export type SupabaseUserMetadata = {
  name?: string;
  email_verified?: boolean;
};

/**
 * Metadata user yang disalurkan dari server ke store Zustand. Sengaja
 * dipersempit dari `JwtPayload` milik Supabase supaya komponen tidak
 * bergantung pada bentuk token.
 *
 * Semua field bisa `null`: JWT tidak menjamin klaimnya lengkap, dan user
 * lama mungkin belum punya baris `profiles`.
 */
export type AuthUser = {
  id: string;
  email: string | null;
  /** Dari user_metadata — bisa dipalsukan user, pakai hanya untuk tampilan. */
  name: string | null;
  /** Dari app_metadata — aman untuk keputusan hak akses. */
  role: UserRole | null;
};
