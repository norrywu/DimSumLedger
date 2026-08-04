import { RIWAYAT_PER_HALAMAN } from "@/constants/cashier-constant";
import { createClient } from "@/lib/supabase/client";
import type { RiwayatTransaksi } from "@/types/cashier";

/**
 * Paginasi keyset, bukan `.range()`. OFFSET memaksa Postgres membaca lalu
 * MEMBUANG semua baris sebelum halaman yang diminta — halaman 1 instan,
 * halaman 200 merangkak. Dengan kursor `created_at`, tiap halaman selalu
 * membaca tepat sebanyak `RIWAYAT_PER_HALAMAN` lewat index
 * `transaksi_kasir_idx (kasir_id, created_at desc)`.
 *
 * Tidak ada filter `kasir_id` di sini: policy `kasir_baca_transaksi_sendiri`
 * sudah membatasi kasir ke notanya sendiri, sedangkan pengelola memang boleh
 * melihat semuanya lewat `pengelola_akses_penuh`.
 */
const KOLOM = `id, created_at, status, kasir_nama, total, dibayar,
   transaksi_item (
     id, nama_produk, nama_varian, jumlah_pcs, qty, harga_satuan,
     transaksi_item_modifier ( id, nama, tambahan_harga )
   )`;

export async function getRiwayatTransaksi(
  cursor?: string,
): Promise<RiwayatTransaksi[]> {
  const supabase = createClient();

  let query = supabase
    .from("transaksi")
    .select(KOLOM)
    .order("created_at", { ascending: false })
    .limit(RIWAYAT_PER_HALAMAN);

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Gagal memuat riwayat: ${error.message}`);
  }

  return data as unknown as RiwayatTransaksi[];
}

/**
 * Nota tunggal untuk dicetak setelah transaksi tersimpan.
 *
 * Diambil ulang dari database, bukan dirakit dari keranjang yang masih di
 * memori: total dihitung server dari `variants.harga_jual`, jadi struk yang
 * dicetak harus berasal dari baris yang BENAR-BENAR tersimpan — bukan dari
 * angka versi klien yang belum tentu sama.
 */
export async function getTransaksiById(id: string): Promise<RiwayatTransaksi> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("transaksi")
    .select(KOLOM)
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(`Gagal memuat nota: ${error.message}`);
  }

  return data as unknown as RiwayatTransaksi;
}
