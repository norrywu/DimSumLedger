import { createClient } from "@/lib/supabase/client";
import type { JenisMutasiStok, StockHistory } from "@/types/stock";

export async function getStockHistory(
  dari: string,
  sampai: string,
  productId?: string,
): Promise<StockHistory[]> {
  const supabase = createClient();

  let query = supabase
    .from("riwayat_stok")
    .select(
      "id, product_id, nama_produk, jenis, jumlah_pcs, catatan, tanggal, pelaku_id, pelaku_nama, created_at, produk:products(nama, lacak_stok)",
    )
    .gte("tanggal", dari)
    .lte("tanggal", sampai);

  if (productId) {
    query = query.eq("product_id", productId);
  }

  const { data, error } = await query
    .order("tanggal", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Gagal memuat riwayat stok: ${error.message}`);
  }

  return data.map(({ produk, jenis, ...row }) => ({
    ...row,
    jenis: jenis as JenisMutasiStok,
    nama_produk: produk?.nama ?? row.nama_produk,
    produk_terhapus: row.product_id === null || produk === null,
    produk_lacak_stok: produk?.lacak_stok ?? false,
  }));
}
