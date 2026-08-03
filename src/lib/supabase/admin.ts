import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { supabaseUrl } from "@/environments";
import { supabaseSecretKey } from "@/environments/supabase-server";
import { Database } from "@/types/supabase";

/**
 * Client dengan kunci rahasia — MENEMBUS SEMUA RLS.
 *
 * Dipakai untuk hal yang memang tidak mungkin dikerjakan atas nama pengguna:
 * membuat akun di `auth.users`, mengganti kata sandi orang lain, menghapus
 * akun. Menu Pengguna adalah pemakai pertamanya.
 *
 * Dari `@supabase/supabase-js`, bukan `@supabase/ssr` seperti dua client
 * lainnya: yang dibawa kunci rahasia, bukan cookie sesi, jadi tidak ada yang
 * perlu dibaca atau ditulis ke `cookies()`.
 *
 * WAJIB dipasangkan dengan `getManager()` dari `@/lib/auth-guard` di setiap
 * Server Action yang memakainya. Server Action bisa dijangkau POST langsung,
 * jadi tanpa penjagaan itu siapa pun yang punya sesi — termasuk kasir — dapat
 * hak penuh atas seluruh database.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(supabaseUrl, supabaseSecretKey, {
    // Tidak ada sesi yang perlu dijaga: client ini dibuat ulang tiap
    // pemanggilan dan mati bersama request-nya. Tanpa dimatikan, supabase-js
    // memasang timer refresh yang tidak akan pernah terpakai.
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
