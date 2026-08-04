import { createClient } from "@/lib/supabase/client";
import type { KatalogExtra, KatalogItem } from "@/types/cashier";

export async function getKatalogJual(): Promise<KatalogItem[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("katalog_jual")
    .select(
      "id, varian_nama, jumlah_pcs, harga_jual, product_id, produk_nama, category_id, kategori_nama",
    )
    .order("kategori_nama")
    .order("produk_nama")
    .order("varian_nama");

  if (error) {
    throw new Error(`Gagal memuat katalog: ${error.message}`);
  }

  return data as unknown as KatalogItem[];
}

export async function getKatalogExtra(): Promise<KatalogExtra[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("katalog_extra")
    .select("id, nama, tambahan_harga")
    .order("nama");

  if (error) {
    throw new Error(`Gagal memuat extra: ${error.message}`);
  }

  return data as unknown as KatalogExtra[];
}

