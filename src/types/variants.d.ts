import type { Tables } from "@/types/supabase";

export type Variant = Pick<
  Tables<"variants">,
  | "id"
  | "product_id"
  | "nama"
  | "jumlah_pcs"
  | "harga_jual"
  | "modal_bahan"
  | "aktif"
> & {
  produk_nama: string;

  kemasan: VariantPackaging[];

  modal_kemasan: number;

  modal_total: number;

  margin: number;
};

export type VariantPackaging = {
  packaging_id: string;
  jumlah: number;
};

export type VariantActionResult =
  | { success: true; message: string }
  | { success: false; message: string };
