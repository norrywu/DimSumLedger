import type { SheetField } from "@/components/sheet-trigger";
import type { SelectOption } from "@/types/form";
import type { VariantFormValues } from "@/validations/variants-validation";

/**
 * Query key react-query, dikumpulkan supaya komponen yang membaca dan yang
 * meng-invalidate memakai key yang sama persis. Kalau ditulis literal di dua
 * tempat, salah ketik satu huruf bikin tabel diam-diam tidak ikut segar setelah
 * simpan atau hapus.
 *
 * Tetap datar meski halamannya punya filter produk: filternya dikerjakan di
 * browser atas hasil query yang sama, jadi tidak ada dimensi yang perlu masuk
 * key. Begitu filternya pindah ke server, key-nya jadi `["variants", productId]`
 * dan semua pemakai ikut disesuaikan dari sini.
 */
export const VARIANTS_KEY = ["variants"];

/**
 * Nilai awal sheet tambah varian.
 *
 * Bertipe `VariantFormValues` (sisi masukan), bukan `VariantInput` (sisi
 * keluaran): angka masih string kosong karena itulah yang dipegang `<Input
 * type="number">` sebelum disentuh. `product_id` juga "" karena Radix Select
 * mengendalikan nilainya lewat `field.value ?? ""`, dan react-hook-form
 * menganggap field tanpa nilai awal sebagai uncontrolled.
 *
 * `aktif` mulai `true` mengikuti default kolomnya — varian baru memang untuk
 * dijual.
 */
export const VARIANT_FORM_DEFAULTS: VariantFormValues = {
  product_id: "",
  nama: "",
  jumlah_pcs: "",
  harga_jual: "",
  modal_bahan: "",
  aktif: true,
};

/**
 * Fungsi, bukan konstanta, karena pilihan produk baru ada setelah
 * `useProducts()` selesai — sama alasannya seperti `productFields`.
 */
export function variantFields(
  productOptions: SelectOption[],
): SheetField<VariantFormValues>[] {
  return [
    {
      name: "product_id",
      label: "Produk",
      type: "select",
      placeholder: "Pilih produk",
      options: productOptions,
    },
    { name: "nama", label: "Nama varian", placeholder: "mis. Isi 10" },
    {
      name: "jumlah_pcs",
      label: "Jumlah pcs",
      type: "number",
      placeholder: "kosongkan bila belum tahu",
    },
    {
      name: "harga_jual",
      label: "Harga jual",
      type: "number",
      placeholder: "mis. 25000",
    },
    {
      name: "modal_bahan",
      label: "Modal bahan",
      type: "number",
      // Modal kemasan tidak dihitung di sini; itu datang dari
      // variant_packagings. Ditulis di placeholder supaya tidak salah isi.
      placeholder: "isi/adonan saja, tanpa kemasan",
    },
    { name: "aktif", label: "Aktif dijual", type: "switch" },
  ];
}
