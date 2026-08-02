import { createClient } from "@/lib/supabase/client";
import type { Packaging } from "@/types/packagings";

/**
 * Query BACA yang dijalankan dari browser. Pembagian tugasnya sama seperti
 * kategori, produk, dan varian: `src/clients/*` untuk baca, `src/servers/*`
 * untuk tulis — alasannya ditulis lengkap di `@/clients/categories`.
 *
 * Paling sederhana di antara semuanya: tanpa embed, jadi `.order("nama")`
 * langsung dikerjakan PostgREST dan hasilnya tidak perlu diratakan atau
 * diurutkan ulang di JavaScript seperti di `getVariants`.
 */
export async function getPackagings(): Promise<Packaging[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("packagings")
    .select("id, nama, harga_satuan")
    .order("nama");

  // react-query membedakan sukses dan gagal lewat lemparan, bukan nilai balik.
  // Beda dengan Server Action, pesan error dari kode browser tidak diredaksi
  // Next di produksi — jadi aman dilempar apa adanya.
  if (error) {
    throw new Error(`Gagal memuat kemasan: ${error.message}`);
  }

  return data;
}
