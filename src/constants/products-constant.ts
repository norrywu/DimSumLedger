import type { SheetField } from "@/components/sheet-trigger";
import type { SelectOption } from "@/types/form";
import type { ProductInput } from "@/validations/products-validation";

/**
 * Query key react-query, dikumpulkan supaya komponen yang membaca dan yang
 * meng-invalidate memakai key yang sama persis. Kalau ditulis literal di dua
 * tempat, salah ketik satu huruf bikin tabel diam-diam tidak ikut segar
 * setelah simpan atau hapus.
 *
 * Masih datar, bukan factory: daftar produk belum punya dimensi filter yang
 * perlu masuk key. Begitu filter kategori ditambahkan, key-nya berubah jadi
 * `["products", categoryId]` dan semua pemakai ikut disesuaikan dari sini.
 */
export const PRODUCTS_KEY = ["products"];

/**
 * Nilai awal sheet tambah produk. Bertipe `ProductInput` supaya kalau nanti
 * ada field baru di `productSchema`, TypeScript langsung menuntut nilai
 * awalnya ikut ditambah.
 *
 * `category_id` mulai sebagai string kosong, bukan undefined: Radix Select
 * mengendalikan nilainya lewat `field.value ?? ""`, dan react-hook-form
 * menganggap field tanpa nilai awal sebagai uncontrolled.
 */
export const PRODUCT_FORM_DEFAULTS: ProductInput = { nama: "", category_id: "" };

/**
 * Fungsi, bukan konstanta seperti `PROFILE_FIELDS`, karena pilihan kategori
 * baru ada setelah `useCategories()` selesai — sama alasannya seperti
 * `productColumns` yang butuh handler dari komponen pemanggil.
 */
export function productFields(
  categoryOptions: SelectOption[],
): SheetField<ProductInput>[] {
  return [
    { name: "nama", label: "Nama produk", placeholder: "mis. Dimsum Mentai" },
    {
      name: "category_id",
      label: "Kategori",
      type: "select",
      placeholder: "Pilih kategori",
      options: categoryOptions,
    },
  ];
}
