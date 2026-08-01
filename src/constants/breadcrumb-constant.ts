/**
 * Label untuk segmen URL yang tidak enak dibaca kalau hanya di-title-case.
 * Segmen yang tidak terdaftar di sini otomatis diformat `app-breadcrumb`
 * (tanda hubung jadi spasi, tiap kata berhuruf besar).
 */
export const SEGMENT_LABELS: Record<string, string> = {
  APP: "Beranda",
  admin: "Admin",
  cashier: "Kasir",
  dashboard: "Dasbor",
  products: "Produk",
  categories: "Kategori",
  users: "Pengguna",
  transactions: "Transaksi",
  order: "Pesanan",
  reports: "Laporan Penjualan",
  shifts: "Shift Saya",
};

/**
 * Segmen yang tidak punya `page.tsx` sendiri — dirender sebagai teks biasa,
 * bukan link, supaya breadcrumb tidak menawarkan tautan ke 404.
 *
 * Set, bukan array: `app-breadcrumb` memanggil `.has()` untuk tiap segmen.
 */
export const NON_LINKABLE_SEGMENTS = new Set(["APP", "admin", "cashier"]);
