/** Kop nota. Ubah di sini — dipakai di setiap struk yang dicetak. */
export const NOTA_TOKO = {
  nama: "Teras Dimsum",
  alamat: "Jl. Aur kuning gg.keluarga pekanbaru riau",
  kontak: "0851-3304-4074 (WA only)",
  penutup: "Terima kasih atas kunjungan Anda.",
};

export type UkuranNota = "58mm" | "80mm" | "a4";

export const PRINTER_MP58N = {
  model: "MP-58N",
  interface: "USB & Bluetooth",
  bluetoothName: "RPP02N",
  bluetoothPin: "0000",
  cmdType: "ESC",
  language: "PC850",
  baudrate: 115200,
  paperWidth: "58mm",
  maxColumns: 32,
  hasBarcode: true,
  hasQr: true,
} as const;

/**
 * Ganti satu baris ini saat printernya berganti — tidak ada tempat lain yang
 * perlu disentuh. Disetel ke 58mm sesuai printer MP-58N.
 */
export const NOTA_UKURAN: UkuranNota = "58mm";

/**
 * `padding` ikut per ukuran karena `@page` dipasang `margin: 0` — seluruh jarak
 * tepi berasal dari sini. Untuk A4 angkanya besar bukan demi estetika: sebagian
 * printer tidak bisa mencetak di ~5mm pertama kertas, dan kop notanya akan
 * terpotong kalau terlalu mepet.
 *
 * Catatan untuk 58mm: tabel empat kolom di `NotaCetak` akan sesak dan nama item
 * mulai membungkus. Masih terbaca, tapi kalau benar-benar dipakai, tata letak
 * bertumpuk lebih pantas.
 */
export const NOTA_UKURAN_SPEK: Record<
  UkuranNota,
  { lebar: string; padding: string }
> = {
  "58mm": { lebar: "58mm", padding: "2mm" },
  "80mm": { lebar: "80mm", padding: "3mm" },
  a4: { lebar: "150mm", padding: "15mm" },
};
