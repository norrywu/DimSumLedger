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

export type RiwayatExtra = {
  id: string;
  nama: string;
  tambahan_harga: number;
};

export type RiwayatItem = {
  id: string;
  nama_produk: string;
  nama_varian: string;
  jumlah_pcs: number | null;
  qty: number;
  harga_satuan: number;
  transaksi_item_modifier: RiwayatExtra[];
};

export type RiwayatTransaksi = {
  id: string;
  created_at: string;
  status: string;
  kasir_nama: string;
  total: number;
  dibayar: number;
  transaksi_item: RiwayatItem[];
};

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
