import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/types/auth";
import type { User } from "@/types/users";

/**
 * Query BACA yang dijalankan dari browser, sama seperti fitur lain — tapi lewat
 * RPC, bukan `.from("profiles")`.
 *
 * Alasannya ada dua, keduanya tidak bisa diselesaikan dari sisi kode: policy
 * SELECT `profiles` cuma "Users can read own profile" sehingga daftar biasa
 * selalu berisi satu baris, dan email tinggal di `auth.users` yang tidak boleh
 * disentuh anon key. Penjagaan hak aksesnya pindah ke badan fungsi — lihat
 * `supabase/schemas/08_daftar_pengguna.sql`.
 */
export async function getUsers(): Promise<User[]> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("daftar_pengguna");

  // react-query membedakan sukses dan gagal lewat lemparan, bukan nilai balik.
  // Kasir yang memaksa membuka halaman ini sampai di sini juga, membawa pesan
  // dari RAISE EXCEPTION di dalam fungsinya.
  if (error) {
    throw new Error(`Gagal memuat pengguna: ${error.message}`);
  }

  // Dua kolom dirapikan di sini, bukan di komponen — sama seperti
  // `getVariants` yang meratakan embed sebelum menyerahkannya ke tabel.
  return data.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    // CHECK constraint tidak terbawa ke tipe hasil generate, jadi `role` di
    // sana cuma `string`. Nilainya dijamin database.
    role: row.role as UserRole,
    created_at: row.created_at,
    // Codegen tidak tahu nullability kolom `RETURNS TABLE` dan menganggapnya
    // selalu terisi; akun yang belum pernah login sebenarnya NULL di sini.
    last_sign_in_at: row.last_sign_in_at,
  }));
}
