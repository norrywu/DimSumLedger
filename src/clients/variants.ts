import { createClient } from "@/lib/supabase/client";
import type { Variant } from "@/types/variants";

export async function getVariants(): Promise<Variant[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("v_hpp_varian")
    .select(
      "id, product_id, nama, jumlah_pcs, harga_jual, modal_bahan, aktif, produk_nama, modal_kemasan, modal_upah, modal_total, margin, kemasan",
    )
    .order("produk_nama")
    .order("nama");

  if (error) {
    throw new Error(`Gagal memuat varian: ${error.message}`);
  }

  return data as unknown as Variant[];
}
