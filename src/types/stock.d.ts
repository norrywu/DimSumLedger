import type { Tables } from "@/types/supabase";

export type JenisMutasiStok = "masuk" | "keluar";

export type StockHistory = Omit<
  Tables<"riwayat_stok">,
  "jenis"
> & {
  jenis: JenisMutasiStok;
  produk_terhapus: boolean;
  produk_lacak_stok: boolean;
};

export type StockActionResult =
  | { success: true; message: string }
  | { success: false; message: string };
