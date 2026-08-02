import { createClient } from "@/lib/supabase/client";
import type { Variant } from "@/types/variants";

/**
 * Query BACA yang dijalankan dari browser. Pembagian tugasnya sama seperti
 * kategori dan produk: `src/clients/*` untuk baca, `src/servers/*` untuk tulis
 * — alasannya ditulis lengkap di `@/clients/categories`.
 *
 * `produk:products(nama)` adalah embed PostgREST lewat foreign key
 * `variants_product_id_fkey`. Karena `product_id` NOT NULL, yang kembali satu
 * objek, bukan larik. Aliasnya dipakai supaya nama field di JSON tidak ikut
 * jamak seperti nama tabelnya.
 *
 * `kemasan:variant_packagings(…)` embed bertingkat: dari varian ke tabel join,
 * lalu dari tabel join ke master kemasannya. Yang ini memang larik — satu
 * varian bisa pakai beberapa kemasan.
 */
export async function getVariants(): Promise<Variant[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("variants")
    // Sengaja satu literal panjang, tidak dipecah dengan `+`. supabase-js
    // mengurai string select ini di level TIPE untuk menyimpulkan bentuk
    // hasilnya; begitu dirangkai dari beberapa potong, literalnya hilang dan
    // seluruh baris jatuh jadi `{ error: true }`.
    .select("id, product_id, nama, jumlah_pcs, harga_jual, modal_bahan, aktif, produk:products(nama), kemasan:variant_packagings(packaging_id, jumlah, packaging:packagings(nama, harga_satuan))");

  // react-query membedakan sukses dan gagal lewat lemparan, bukan nilai balik.
  // Beda dengan Server Action, pesan error dari kode browser tidak diredaksi
  // Next di produksi — jadi aman dilempar apa adanya.
  if (error) {
    throw new Error(`Gagal memuat varian: ${error.message}`);
  }

  return (
    data
      .map(({ produk, kemasan, ...varian }) => {
        // Diratakan di sini, bukan di kolom tabel: bentuk embed adalah urusan
        // lapisan query. Kolom cukup tahu ada `produk_nama` bertipe string dan
        // `kemasan` yang sudah datar.
        const daftarKemasan = kemasan.map(
          ({ packaging_id, jumlah, packaging }) => ({
            packaging_id,
            jumlah,
            nama: packaging?.nama ?? "—",
            harga_satuan: packaging?.harga_satuan ?? 0,
          }),
        );

        // Biaya DIHITUNG, tidak disimpan sebagai kolom. Justru itu gunanya
        // tabel join: begitu harga "Mika 10" naik di halaman Kemasan, modal
        // semua varian yang memakainya langsung ikut benar tanpa migrasi
        // apa pun. Kolom cache akan basi diam-diam.
        const modal_kemasan = daftarKemasan.reduce(
          (jumlahnya, item) => jumlahnya + item.harga_satuan * item.jumlah,
          0,
        );
        const modal_total = varian.modal_bahan + modal_kemasan;

        return {
          ...varian,
          produk_nama: produk?.nama ?? "—",
          kemasan: daftarKemasan,
          modal_kemasan,
          modal_total,
          margin: varian.harga_jual - modal_total,
        };
      })
      // Diurutkan di sini, bukan lewat `.order()`. Urutan yang dimau adalah
      // "per produk, lalu per nama varian", sedangkan
      // `.order("nama", { referencedTable: "products" })` cuma mengurutkan
      // resource yang di-embed — baris induknya tidak ikut tersusun.
      .sort(
        (a, b) =>
          a.produk_nama.localeCompare(b.produk_nama, "id") ||
          a.nama.localeCompare(b.nama, "id"),
      )
  );
}
