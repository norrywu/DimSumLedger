export type KatalogItem = {
  id: string;
  varian_nama: string;
  jumlah_pcs: number | null;
  harga_jual: number;
  product_id: string;
  produk_nama: string;
  category_id: string;
  kategori_nama: string;
};

export type KatalogExtra = {
  id: string;
  nama: string;
  tambahan_harga: number;
};

export type TransaksiActionResult =
  | { success: true; message: string; id: string }
  | { success: false; message: string };

export type CartItem = {
  key: string;
  variant_id: string;
  produk_nama: string;
  varian_nama: string;
  jumlah_pcs: number | null;
  harga_satuan: number;
  qty: number;
  extra: KatalogExtra[];
};
