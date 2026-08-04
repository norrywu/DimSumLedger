import { createClient } from "@/lib/supabase/client";
import type { RiwayatTransaksi } from "@/types/cashier";

// Tidak ada filter `kasir_id` di sini: policy `kasir_baca_transaksi_sendiri`
// sudah membatasi kasir ke notanya sendiri, sedangkan pengelola memang boleh
// melihat semuanya lewat `pengelola_akses_penuh`.
export async function getRiwayatTransaksi(): Promise<RiwayatTransaksi[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("transaksi")
    .select(
      `id, created_at, status, total, dibayar,
       transaksi_item (
         id, nama_produk, nama_varian, jumlah_pcs, qty, harga_satuan,
         transaksi_item_modifier ( id, nama, tambahan_harga )
       )`,
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(`Gagal memuat riwayat: ${error.message}`);
  }

  return data as unknown as RiwayatTransaksi[];
}
