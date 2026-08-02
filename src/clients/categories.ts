import { createClient } from "@/lib/supabase/client";
import type { Category } from "@/types/categories";

/**
 * Query BACA yang dijalankan dari browser.
 *
 * Pembagian tugas di proyek ini:
 * - `src/clients/*` — baca, lewat browser client. HTTP GET biasa ke PostgREST,
 *   jadi beberapa query bisa jalan paralel. Server Action tidak bisa: Next
 *   mengirimnya satu per satu per client (server-actions.md:28), sehingga
 *   layar yang butuh banyak data akan mengantre.
 * - `src/servers/*` — tulis, lewat Server Action. Di sanalah `categorySchema`
 *   divalidasi ulang. Ini penting karena kolomnya cuma `nama text not null` —
 *   batas 50 karakter hanya ada di kode, bukan di database.
 *
 * Keamanannya bersandar pada RLS. Cookie sesi ikut terbawa otomatis, jadi
 * policy `internal.is_pengelola()` berlaku sama persis seperti saat query ini
 * masih jalan di server. Setiap tabel baru wajib punya policy sejak awal.
 */
export async function getCategories(): Promise<Category[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("categories")
    .select("id, nama")
    .order("nama");

  // react-query membedakan sukses dan gagal lewat lemparan, bukan nilai balik.
  // Beda dengan Server Action, pesan error dari kode browser tidak diredaksi
  // Next di produksi — jadi aman dilempar apa adanya.
  if (error) {
    throw new Error(`Gagal memuat kategori: ${error.message}`);
  }

  return data;
}
